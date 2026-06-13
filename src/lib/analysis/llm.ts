import Anthropic from "@anthropic-ai/sdk";
import type { TechnicalIndicators } from "@/lib/analysis/technical";

/**
 * Optional LLM layer for analyst notes and earnings briefs.
 *
 * Provider selection (first key found wins):
 *   1. DEEPSEEK_API_KEY  — OpenAI-compatible endpoint (model: DEEPSEEK_MODEL,
 *      default "deepseek-chat"; base: DEEPSEEK_BASE_URL)
 *   2. ANTHROPIC_API_KEY — Claude via the official SDK (model: ANALYSIS_MODEL)
 *
 * With neither key set every feature degrades to its deterministic fallback.
 */

const NARRATIVE_SYSTEM =
  "You are a senior Indian equity research analyst writing a terminal note. " +
  "You are given a multi-pillar intelligence score (0-100) for an NSE-listed security. " +
  "Write a tight 4-6 sentence analyst note: explain WHY the score is what it is by " +
  "synthesizing the strongest and weakest pillars, flag the single biggest risk to the " +
  "thesis, and mention concrete price levels. Never issue buy/sell commands — explain. " +
  "Plain text only, no markdown, no preamble, no disclaimers (the UI shows one).";

const BRIEF_SYSTEM =
  "You are an equity research associate. From news headlines about an Indian company's " +
  "latest quarterly results, produce a factual three-part brief. Only state what the " +
  "headlines support; if coverage is thin, say so plainly. No advice, no markdown.";

/* ---- DeepSeek (OpenAI-compatible) ---- */

async function deepseekChat(
  system: string,
  user: string,
  maxTokens: number,
  jsonMode: boolean
): Promise<string | null> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return null;
  const base = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
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
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`DeepSeek ${res.status}`);
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return json.choices?.[0]?.message?.content?.trim() || null;
}

/* ---- Narrative ---- */

interface NarrativeInput {
  symbol: string;
  name?: string;
  overallScore: number;
  stance: string;
  pillars: Array<{ pillar: string; score: number; drivers: string[]; cautions: string[] }>;
  technicals: TechnicalIndicators;
  headlines: string[];
}

export async function generateNarrative(
  input: NarrativeInput
): Promise<string | null> {
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

  try {
    if (process.env.DEEPSEEK_API_KEY) {
      return await deepseekChat(NARRATIVE_SYSTEM, context, 600, false);
    }
    if (process.env.ANTHROPIC_API_KEY) {
      const client = new Anthropic();
      const response = await client.messages.create({
        model: process.env.ANALYSIS_MODEL ?? "claude-opus-4-8",
        max_tokens: 1024,
        system: NARRATIVE_SYSTEM,
        messages: [{ role: "user", content: context }],
      });
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join(" ")
        .trim();
      return text || null;
    }
  } catch {
    // Any provider failure falls back to the deterministic narrative.
  }
  return null;
}

/* ---- Earnings brief ---- */

export interface EarningsBriefSummary {
  financials: string;
  discussions: string;
  managementCommentary: string;
}

function parseBrief(text: string): EarningsBriefSummary | null {
  try {
    const obj = JSON.parse(text) as Partial<EarningsBriefSummary>;
    if (obj.financials && obj.discussions && obj.managementCommentary) {
      return obj as EarningsBriefSummary;
    }
  } catch {
    // fall through
  }
  return null;
}

export async function generateEarningsBrief(
  company: string,
  resultHeadlines: string[],
  commentaryHeadlines: string[]
): Promise<EarningsBriefSummary | null> {
  if (resultHeadlines.length + commentaryHeadlines.length === 0) return null;

  const user = JSON.stringify({
    company,
    results_coverage: resultHeadlines,
    management_commentary_coverage: commentaryHeadlines,
  });

  try {
    if (process.env.DEEPSEEK_API_KEY) {
      const text = await deepseekChat(
        BRIEF_SYSTEM +
          ' Respond with a JSON object exactly of the shape {"financials": "2-3 sentences on revenue/profit/margins", ' +
          '"discussions": "2-3 sentences on other material points — segments, dividends, orders, outlook", ' +
          '"managementCommentary": "2-3 sentences on what top executives emphasised"}.',
        user,
        800,
        true
      );
      return text ? parseBrief(text) : null;
    }
    if (process.env.ANTHROPIC_API_KEY) {
      const client = new Anthropic();
      const response = await client.messages.create({
        model: process.env.ANALYSIS_MODEL ?? "claude-opus-4-8",
        max_tokens: 1200,
        system: BRIEF_SYSTEM,
        messages: [{ role: "user", content: user }],
        output_config: {
          format: {
            type: "json_schema",
            schema: {
              type: "object",
              properties: {
                financials: {
                  type: "string",
                  description: "2-3 sentences: revenue/profit/margin picture from the latest reported quarter",
                },
                discussions: {
                  type: "string",
                  description: "2-3 sentences: other material points in the results — segments, one-offs, dividends, orders, outlook",
                },
                managementCommentary: {
                  type: "string",
                  description: "2-3 sentences: what top executives emphasised while announcing results — guidance, tone, strategic priorities",
                },
              },
              required: ["financials", "discussions", "managementCommentary"],
              additionalProperties: false,
            },
          },
        },
      });
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
      return parseBrief(text);
    }
  } catch {
    // fall through to headline-only UI
  }
  return null;
}
