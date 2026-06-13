import Anthropic from "@anthropic-ai/sdk";
import { cached } from "@/lib/cache";
import type { TechnicalIndicators } from "@/lib/analysis/technical";

/**
 * LLM layer with a two-tier OpenRouter setup:
 *
 *   FREE tier  (OPENROUTER_FREE_MODEL, $0)   · earnings briefs, headline
 *              sentiment NLP. Used liberally; no daily cap.
 *   PAID tier  (OPENROUTER_PAID_MODEL)       · only the Intelligence Score
 *              narrative, guarded by LLM_PAID_DAILY_TOKENS. When the daily
 *              budget is exhausted the call silently downgrades to FREE.
 *
 * Fallback chain per call: OpenRouter → DeepSeek direct → Anthropic → null
 * (deterministic non-LLM output). All providers are optional.
 */

/* ---- Paid-tier daily budget (IST day, in-memory per server process) ---- */

const paidBudget = { day: "", tokensUsed: 0 };

function istDay(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function paidDailyLimit(): number {
  return parseInt(process.env.LLM_PAID_DAILY_TOKENS ?? "1000000");
}

function paidBudgetAvailable(): boolean {
  const today = istDay();
  if (paidBudget.day !== today) {
    paidBudget.day = today;
    paidBudget.tokensUsed = 0;
  }
  return paidBudget.tokensUsed < paidDailyLimit();
}

function recordPaidUsage(tokens: number) {
  paidBudget.tokensUsed += tokens;
}

export function getPaidBudgetStatus() {
  paidBudgetAvailable(); // roll the day if needed
  return { day: paidBudget.day, tokensUsed: paidBudget.tokensUsed, limit: paidDailyLimit() };
}

/* ---- OpenRouter client ---- */

type Tier = "free" | "paid";

export function freeModel(): string {
  return process.env.OPENROUTER_FREE_MODEL ?? "openai/gpt-oss-120b:free";
}

/** The two paid models that run together as an ensemble. */
export function paidModels(): string[] {
  return [
    process.env.OPENROUTER_PAID_MODEL_A ?? "deepseek/deepseek-v4-flash",
    process.env.OPENROUTER_PAID_MODEL_B ?? "openai/gpt-4o-mini",
  ];
}

/** Low-level call to a specific OpenRouter model. `paid` flags budget metering. */
async function openrouterModel(
  model: string,
  paid: boolean,
  system: string,
  user: string,
  maxTokens: number,
  jsonMode: boolean
): Promise<string | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Indian Financial Terminal",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`OpenRouter ${model} ${res.status}`);
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
  };
  if (paid) recordPaidUsage(json.usage?.total_tokens ?? maxTokens);
  return json.choices?.[0]?.message?.content?.trim() || null;
}

async function openrouterChat(
  tier: Tier,
  system: string,
  user: string,
  maxTokens: number,
  jsonMode: boolean
): Promise<string | null> {
  // Paid single-model requests use model A, and downgrade to free once spent.
  const usePaid = tier === "paid" && paidBudgetAvailable();
  const model = usePaid ? paidModels()[0] : freeModel();
  return openrouterModel(model, usePaid, system, user, maxTokens, jsonMode);
}

/* ---- Legacy fallback providers ---- */

async function deepseekChat(
  system: string,
  user: string,
  maxTokens: number,
  jsonMode: boolean
): Promise<string | null> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return null;
  const base = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`DeepSeek ${res.status}`);
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content?.trim() || null;
}

async function anthropicChat(
  system: string,
  user: string,
  maxTokens: number
): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const client = new Anthropic();
  const response = await client.messages.create({
    model: process.env.ANALYSIS_MODEL ?? "claude-opus-4-8",
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  return (
    response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join(" ")
      .trim() || null
  );
}

/** Provider waterfall. Each provider is attempted at most once. */
async function complete(
  tier: Tier,
  system: string,
  user: string,
  maxTokens: number,
  jsonMode = false
): Promise<string | null> {
  for (const attempt of [
    () => openrouterChat(tier, system, user, maxTokens, jsonMode),
    () => deepseekChat(system, user, maxTokens, jsonMode),
    () => anthropicChat(system, user, maxTokens),
  ]) {
    try {
      const out = await attempt();
      if (out) return out;
    } catch {
      // try next provider
    }
  }
  return null;
}

/* ---- Headline sentiment NLP (FREE tier) ---- */

export interface LlmSentiment {
  score: number; // -1..1
  rationale: string;
  positives: string[];
  negatives: string[];
}

export async function llmSentiment(
  company: string,
  headlines: string[]
): Promise<LlmSentiment | null> {
  if (headlines.length < 3) return null;
  const text = await complete(
    "free",
    "You are a markets NLP engine. Read news headlines about an Indian listed company and judge " +
      "the net sentiment FOR ITS STOCK (not general news tone). Weigh materiality: results, " +
      "guidance, orders, regulation and ratings matter more than routine coverage. Respond with " +
      'a JSON object: {"score": number between -1 and 1, "rationale": "one sentence", ' +
      '"positives": ["up to 3 short phrases"], "negatives": ["up to 3 short phrases"]}',
    JSON.stringify({ company, headlines }),
    500,
    true
  );
  if (!text) return null;
  try {
    const obj = JSON.parse(text) as Partial<LlmSentiment>;
    if (typeof obj.score !== "number" || !obj.rationale) return null;
    return {
      score: Math.max(-1, Math.min(1, obj.score)),
      rationale: obj.rationale,
      positives: obj.positives ?? [],
      negatives: obj.negatives ?? [],
    };
  } catch {
    return null;
  }
}

/**
 * Shared cache so the Intelligence Score and the chart projection consume a
 * single free-tier sentiment call per symbol per window.
 */
export function cachedLlmSentiment(
  symbol: string,
  company: string,
  headlines: string[]
): Promise<LlmSentiment | null> {
  return cached(`llm-sentiment:${symbol}`, 10 * 60 * 1000, () =>
    llmSentiment(company, headlines)
  );
}

/* ---- Intelligence Score narrative (PAID tier, budget-guarded) ---- */

interface NarrativeInput {
  symbol: string;
  name?: string;
  overallScore: number;
  stance: string;
  pillars: Array<{ pillar: string; score: number; drivers: string[]; cautions: string[] }>;
  technicals: TechnicalIndicators;
  headlines: string[];
}

export async function generateNarrative(input: NarrativeInput): Promise<string | null> {
  const context = JSON.stringify({
    security: input.name ?? input.symbol,
    overall_score_0_100: input.overallScore,
    derived_stance: input.stance,
    pillars: input.pillars,
    technicals: {
      last: input.technicals.last,
      rsi14: input.technicals.rsi14?.toFixed(1),
      support: input.technicals.support,
      resistance: input.technicals.resistance,
      pct_from_52w_high: input.technicals.pctFrom52wHigh?.toFixed(1),
      annualized_vol_pct: input.technicals.annualizedVolatility?.toFixed(0),
    },
    recent_headlines: input.headlines,
  });

  return complete(
    "paid",
    "You are a senior Indian equity research analyst writing a terminal note. " +
      "You are given a multi-pillar intelligence score (0-100) for an NSE-listed security. " +
      "Write a tight 4-6 sentence analyst note: explain WHY the score is what it is by " +
      "synthesizing the strongest and weakest pillars, reconcile the technical picture with the " +
      "news flow, flag the single biggest risk to the thesis, and mention concrete price levels. " +
      "Never issue buy/sell commands · explain. Plain text only, no markdown, no preamble, " +
      "no disclaimers (the UI shows one).",
    context,
    600
  );
}

/* ---- Dual-model ensemble: technical + sentiment + projection ---- */

export interface EnsembleModelView {
  model: string;
  sentiment: number; // -1..1
  technicalBias: number; // -1..1
  baseReturnPct: number; // expected % move over the horizon (base case)
  bullReturnPct: number;
  bearReturnPct: number;
  confidence: number; // 0..1
  note: string;
}

export interface EnsembleInput {
  security: string;
  horizonSessions: number;
  technicals: Record<string, unknown>;
  fundamentals: Record<string, unknown>;
  patternShape?: string;
  headlines: string[];
}

const ENSEMBLE_SYSTEM = (h: number) =>
  "You are an Indian equity desk analyst. Given technicals, fundamentals, a detected chart " +
  "pattern and recent headlines for an NSE security, judge BOTH the technical posture and the " +
  "news sentiment, then project the likely path. Be decisive but calibrated; base your return " +
  `estimates on the ~${h}-trading-session horizon given. Respond with ONLY a JSON object: ` +
  '{"sentiment": <-1..1 news/stock sentiment>, "technical_bias": <-1..1 chart posture>, ' +
  '"base_return_pct": <most-likely % move over the horizon>, "bull_return_pct": <upside case %>, ' +
  '"bear_return_pct": <downside case %>, "confidence": <0..1>, ' +
  '"note": "2 crisp sentences on the call, citing the pattern and the single biggest risk"}';

function parseModelView(model: string, text: string | null): EnsembleModelView | null {
  if (!text) return null;
  try {
    const o = JSON.parse(text) as Record<string, unknown>;
    const num = (k: string, d = 0) => {
      const v = o[k];
      return typeof v === "number" && Number.isFinite(v) ? v : d;
    };
    const note = typeof o.note === "string" ? o.note : "";
    if (!note) return null;
    return {
      model,
      sentiment: Math.max(-1, Math.min(1, num("sentiment"))),
      technicalBias: Math.max(-1, Math.min(1, num("technical_bias"))),
      baseReturnPct: num("base_return_pct"),
      bullReturnPct: num("bull_return_pct"),
      bearReturnPct: num("bear_return_pct"),
      confidence: Math.max(0, Math.min(1, num("confidence", 0.4))),
      note,
    };
  } catch {
    return null;
  }
}

export interface EnsembleResult {
  source: "ensemble" | "free" | "none";
  models: EnsembleModelView[];
  sentiment: number;
  technicalBias: number;
  baseReturnPct: number;
  bullReturnPct: number;
  bearReturnPct: number;
  confidence: number;
}

function average(views: EnsembleModelView[]): Omit<EnsembleResult, "source" | "models"> {
  const m = (sel: (v: EnsembleModelView) => number) =>
    views.reduce((a, v) => a + sel(v), 0) / views.length;
  return {
    sentiment: m((v) => v.sentiment),
    technicalBias: m((v) => v.technicalBias),
    baseReturnPct: m((v) => v.baseReturnPct),
    bullReturnPct: Math.max(...views.map((v) => v.bullReturnPct)),
    bearReturnPct: Math.min(...views.map((v) => v.bearReturnPct)),
    confidence: m((v) => v.confidence),
  };
}

/**
 * Runs BOTH paid models in parallel (DeepSeek + GPT-4o-mini) and averages their
 * numeric calls, keeping each model's note for transparency. Both draw from the
 * shared paid token budget; once it is exhausted the whole ensemble downgrades
 * to a single free-model call.
 */
export async function runEnsemble(input: EnsembleInput): Promise<EnsembleResult> {
  const system = ENSEMBLE_SYSTEM(input.horizonSessions);
  const user = JSON.stringify(input);

  if (process.env.OPENROUTER_API_KEY && paidBudgetAvailable()) {
    const results = await Promise.all(
      paidModels().map((model) =>
        openrouterModel(model, true, system, user, 500, true)
          .then((t) => parseModelView(model, t))
          .catch(() => null)
      )
    );
    const views = results.filter((v): v is EnsembleModelView => v !== null);
    if (views.length > 0) {
      return { source: "ensemble", models: views, ...average(views) };
    }
  }

  // Budget spent or paid failed: one free-model call.
  try {
    const text = await openrouterModel(freeModel(), false, system, user, 500, true);
    const view = parseModelView(freeModel(), text);
    if (view) return { source: "free", models: [view], ...average([view]) };
  } catch {
    // fall through
  }

  return {
    source: "none",
    models: [],
    sentiment: 0,
    technicalBias: 0,
    baseReturnPct: 0,
    bullReturnPct: 0,
    bearReturnPct: 0,
    confidence: 0,
  };
}

/* ---- Earnings brief (FREE tier) ---- */

export interface EarningsBriefSummary {
  financials: string;
  discussions: string;
  managementCommentary: string;
}

export async function generateEarningsBrief(
  company: string,
  resultHeadlines: string[],
  commentaryHeadlines: string[]
): Promise<EarningsBriefSummary | null> {
  if (resultHeadlines.length + commentaryHeadlines.length === 0) return null;

  const text = await complete(
    "free",
    "You are an equity research associate. From news headlines about an Indian company's " +
      "latest quarterly results, produce a factual three-part brief. Only state what the " +
      "headlines support; if coverage is thin, say so plainly. No advice, no markdown. " +
      'Respond with a JSON object exactly of the shape {"financials": "2-3 sentences on ' +
      'revenue/profit/margins", "discussions": "2-3 sentences on other material points · ' +
      'segments, dividends, orders, outlook", "managementCommentary": "2-3 sentences on what ' +
      'top executives emphasised"}',
    JSON.stringify({
      company,
      results_coverage: resultHeadlines,
      management_commentary_coverage: commentaryHeadlines,
    }),
    800,
    true
  );
  if (!text) return null;
  try {
    const obj = JSON.parse(text) as Partial<EarningsBriefSummary>;
    if (obj.financials && obj.discussions && obj.managementCommentary) {
      return obj as EarningsBriefSummary;
    }
  } catch {
    // malformed · headline-only UI
  }
  return null;
}
