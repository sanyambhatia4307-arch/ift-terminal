import Anthropic from "@anthropic-ai/sdk";
import type { TechnicalIndicators } from "@/lib/analysis/technical";

/**
 * Optional Claude-written analyst note. Activates only when
 * ANTHROPIC_API_KEY is set; the intelligence framework works fully without it.
 */

interface NarrativeInput {
  symbol: string;
  name?: string;
  overallScore: number;
  stance: string;
  pillars: Array<{ pillar: string; score: number; drivers: string[]; cautions: string[] }>;
  technicals: TechnicalIndicators;
  headlines: string[];
}

export interface EarningsBriefSummary {
  financials: string;
  discussions: string;
  managementCommentary: string;
}

/**
 * Optional Claude synthesis of results coverage into a three-part brief.
 * Returns null without ANTHROPIC_API_KEY or on any failure.
 */
export async function generateEarningsBrief(
  company: string,
  resultHeadlines: string[],
  commentaryHeadlines: string[]
): Promise<EarningsBriefSummary | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (resultHeadlines.length + commentaryHeadlines.length === 0) return null;
  try {
    const client = new Anthropic();
    const model = process.env.ANALYSIS_MODEL ?? "claude-opus-4-8";
    const response = await client.messages.create({
      model,
      max_tokens: 1200,
      system:
        "You are an equity research associate. From news headlines about an Indian company's " +
        "latest quarterly results, produce a factual three-part brief. Only state what the " +
        "headlines support; if coverage is thin, say so plainly. No advice, no markdown.",
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            company,
            results_coverage: resultHeadlines,
            management_commentary_coverage: commentaryHeadlines,
          }),
        },
      ],
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
    return JSON.parse(text) as EarningsBriefSummary;
  } catch {
    return null;
  }
}

export async function generateNarrative(
  input: NarrativeInput
): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    const client = new Anthropic();
    const model = process.env.ANALYSIS_MODEL ?? "claude-opus-4-8";

    const context = {
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
    };

    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      system:
        "You are a senior Indian equity research analyst writing a terminal note. " +
        "You are given a multi-pillar intelligence score (0-100) for an NSE-listed security. " +
        "Write a tight 4-6 sentence analyst note: explain WHY the score is what it is by " +
        "synthesizing the strongest and weakest pillars, flag the single biggest risk to the " +
        "thesis, and mention concrete price levels. Never issue buy/sell commands — explain. " +
        "Plain text only, no markdown, no preamble, no disclaimers (the UI shows one).",
      messages: [
        { role: "user", content: JSON.stringify(context) },
      ],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join(" ")
      .trim();
    return text || null;
  } catch {
    // Any API failure falls back to the deterministic narrative.
    return null;
  }
}
