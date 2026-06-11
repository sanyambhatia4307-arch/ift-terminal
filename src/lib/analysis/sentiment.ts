import type { NewsItem } from "@/types/market";

/**
 * Lexicon-based headline sentiment. Deliberately simple and transparent —
 * each headline is scored by bullish/bearish keyword hits so the result
 * is explainable, free, and deterministic.
 */

const BULLISH = [
  "surge", "soar", "rally", "jump", "gain", "rise", "beat", "beats", "record",
  "profit", "growth", "upgrade", "upgraded", "buy", "outperform", "strong",
  "wins", "win", "order", "approval", "approve", "expand", "expansion",
  "dividend", "bonus", "buyback", "milestone", "high", "bullish", "positive",
  "boost", "acquire", "acquisition", "deal", "partnership", "launch",
];

const BEARISH = [
  "fall", "falls", "drop", "plunge", "slump", "decline", "miss", "misses",
  "loss", "losses", "downgrade", "downgraded", "sell", "underperform", "weak",
  "probe", "investigation", "fraud", "penalty", "fine", "recall", "lawsuit",
  "default", "debt", "cut", "cuts", "layoff", "low", "bearish", "negative",
  "warning", "concern", "crash", "scam", "resign", "exit",
];

export interface SentimentResult {
  score: number; // -1..1
  positive: number;
  negative: number;
  neutral: number;
  sampleBullish?: string;
  sampleBearish?: string;
}

export function scoreNewsSentiment(items: NewsItem[]): SentimentResult {
  let positive = 0;
  let negative = 0;
  let neutral = 0;
  let sampleBullish: string | undefined;
  let sampleBearish: string | undefined;

  for (const item of items) {
    const words = item.title.toLowerCase().split(/[^a-z]+/);
    const bulls = words.filter((w) => BULLISH.includes(w)).length;
    const bears = words.filter((w) => BEARISH.includes(w)).length;
    if (bulls > bears) {
      positive++;
      sampleBullish ??= item.title;
    } else if (bears > bulls) {
      negative++;
      sampleBearish ??= item.title;
    } else {
      neutral++;
    }
  }

  const scored = positive + negative;
  const score = scored === 0 ? 0 : (positive - negative) / Math.max(scored, 3);

  return { score, positive, negative, neutral, sampleBullish, sampleBearish };
}
