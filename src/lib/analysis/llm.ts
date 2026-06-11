import Anthropic from "@anthropic-ai/sdk";
import type { AnalysisFactor } from "@/lib/analysis/engine";
import type { TechnicalIndicators } from "@/lib/analysis/technical";
import type { SentimentResult } from "@/lib/analysis/sentiment";

/**
 * Optional Claude-written analyst note. Activates only when
 * ANTHROPIC_API_KEY is set; the signal engine works fully without it.
 */

interface NarrativeInput {
  symbol: string;
  name?: string;
  verdict: string;
  compositeScore: number;
  factors: AnalysisFactor[];
  technicals: TechnicalIndicators;
  sentiment: SentimentResult;
  headlines: string[];
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
      engine_verdict: input.verdict,
      composite_score: input.compositeScore.toFixed(2),
      factors: input.factors.map((f) => ({
        factor: f.name,
        score: f.score.toFixed(2),
        detail: f.detail,
      })),
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
        "You are given a quantitative signal engine's output for an NSE-listed security. " +
        "Write a tight 4-6 sentence analyst note: synthesize the technical picture, news flow, " +
        "and street view; flag the biggest risk to the engine's verdict; mention concrete price levels. " +
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
