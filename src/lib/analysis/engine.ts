import { computeIndicators, type TechnicalIndicators } from "@/lib/analysis/technical";
import { scoreNewsSentiment, type SentimentResult } from "@/lib/analysis/sentiment";
import { generateNarrative } from "@/lib/analysis/llm";
import { getChart, getFundamentals, getNews } from "@/lib/market";
import type { FundamentalsData, NewsItem } from "@/types/market";

export type Verdict = "BUY" | "HOLD" | "SELL";

export interface AnalysisFactor {
  name: string;
  score: number; // -1..1
  weight: number;
  detail: string;
}

export interface AnalysisResult {
  symbol: string;
  verdict: Verdict;
  compositeScore: number; // -1..1
  confidence: "low" | "medium" | "high";
  factors: AnalysisFactor[];
  technicals: TechnicalIndicators;
  sentiment: SentimentResult;
  analyst: {
    consensus?: string;
    targetMeanPrice?: number;
    upsidePercent?: number;
    numberOfAnalysts?: number;
  };
  narrative: string;
  narrativeSource: "claude" | "rules";
  generatedAt: number;
}

const clamp = (n: number, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, n));

function technicalFactors(t: TechnicalIndicators): AnalysisFactor[] {
  const factors: AnalysisFactor[] = [];

  if (t.sma50 && t.sma200) {
    const above50 = t.last > t.sma50;
    const above200 = t.last > t.sma200;
    const golden = t.sma50 > t.sma200;
    const score = clamp((above50 ? 0.4 : -0.4) + (above200 ? 0.3 : -0.3) + (golden ? 0.3 : -0.3));
    factors.push({
      name: "Trend (vs 50/200 DMA)",
      score,
      weight: 0.18,
      detail: `Price ${above50 ? "above" : "below"} 50-DMA and ${above200 ? "above" : "below"} 200-DMA; ${golden ? "golden" : "death"}-cross regime.`,
    });
  }

  if (t.rsi14 !== undefined) {
    // Mean-reversion read: oversold is an opportunity, overbought a risk.
    const score = t.rsi14 < 30 ? 0.8 : t.rsi14 < 40 ? 0.4 : t.rsi14 > 70 ? -0.8 : t.rsi14 > 60 ? -0.3 : 0.1;
    factors.push({
      name: "RSI (14)",
      score,
      weight: 0.1,
      detail: `RSI at ${t.rsi14.toFixed(1)} — ${t.rsi14 < 30 ? "oversold" : t.rsi14 > 70 ? "overbought" : "neutral zone"}.`,
    });
  }

  if (t.macdHistogram !== undefined) {
    const score = clamp(t.macdHistogram > 0 ? 0.5 : -0.5);
    factors.push({
      name: "MACD momentum",
      score,
      weight: 0.08,
      detail: `MACD histogram is ${t.macdHistogram > 0 ? "positive (bullish momentum)" : "negative (bearish momentum)"}.`,
    });
  }

  if (t.return3M !== undefined && t.return1M !== undefined) {
    const score = clamp((t.return3M / 20 + t.return1M / 10) / 2);
    factors.push({
      name: "Price momentum",
      score,
      weight: 0.09,
      detail: `1M ${t.return1M >= 0 ? "+" : ""}${t.return1M.toFixed(1)}%, 3M ${t.return3M >= 0 ? "+" : ""}${t.return3M.toFixed(1)}%.`,
    });
  }

  return factors;
}

function fundamentalFactor(f: FundamentalsData | null): AnalysisFactor | null {
  if (!f) return null;
  let score = 0;
  const notes: string[] = [];
  if (f.returnOnEquity !== undefined) {
    score += f.returnOnEquity > 0.15 ? 0.4 : f.returnOnEquity > 0.08 ? 0.15 : -0.3;
    notes.push(`ROE ${(f.returnOnEquity * 100).toFixed(1)}%`);
  }
  if (f.profitMargin !== undefined) {
    score += f.profitMargin > 0.12 ? 0.3 : f.profitMargin > 0 ? 0.1 : -0.4;
    notes.push(`net margin ${(f.profitMargin * 100).toFixed(1)}%`);
  }
  if (f.revenueGrowth !== undefined) {
    score += f.revenueGrowth > 0.12 ? 0.3 : f.revenueGrowth > 0 ? 0.1 : -0.3;
    notes.push(`revenue growth ${(f.revenueGrowth * 100).toFixed(1)}%`);
  }
  if (notes.length === 0) return null;
  return {
    name: "Fundamental quality",
    score: clamp(score),
    weight: 0.2,
    detail: notes.join(", ") + ".",
  };
}

function analystFactor(f: FundamentalsData | null, last: number): AnalysisFactor | null {
  if (!f?.recommendationKey && !f?.targetMeanPrice) return null;
  const recMap: Record<string, number> = {
    strong_buy: 1, buy: 0.6, hold: 0, underperform: -0.6, sell: -1,
  };
  const rec = f.recommendationKey ? (recMap[f.recommendationKey] ?? 0) : 0;
  const upside = f.targetMeanPrice ? ((f.targetMeanPrice - last) / last) * 100 : undefined;
  const upsideScore = upside !== undefined ? clamp(upside / 25) : 0;
  return {
    name: "Street consensus",
    score: clamp(rec * 0.6 + upsideScore * 0.4),
    weight: 0.2,
    detail: `${f.numberOfAnalysts ?? "—"} analysts, consensus ${f.recommendationKey?.replace(/_/g, " ") ?? "n/a"}${
      upside !== undefined ? `, target implies ${upside >= 0 ? "+" : ""}${upside.toFixed(1)}% vs current price` : ""
    }.`,
  };
}

function rulesNarrative(
  symbol: string,
  verdict: Verdict,
  factors: AnalysisFactor[],
  t: TechnicalIndicators
): string {
  const sorted = [...factors].sort((a, b) => Math.abs(b.score * b.weight) - Math.abs(a.score * a.weight));
  const drivers = sorted.slice(0, 3).map((f) => `${f.name.toLowerCase()} (${f.detail})`);
  return (
    `The signal engine rates ${symbol} a ${verdict}. ` +
    `Primary drivers: ${drivers.join("; ")} ` +
    `Key levels to watch: support near ₹${t.support?.toFixed(0)} and resistance near ₹${t.resistance?.toFixed(0)}. ` +
    `Annualized volatility is ${t.annualizedVolatility?.toFixed(0)}%, so size positions accordingly.`
  );
}

export async function buildAnalysis(symbol: string): Promise<AnalysisResult> {
  const chart = await getChart(symbol, "1y", "1d");
  const technicals = computeIndicators(chart.candles);
  if (!technicals) throw new Error("Insufficient price history for analysis");

  let fundamentals: FundamentalsData | null = null;
  try {
    fundamentals = await getFundamentals(symbol);
  } catch {
    // Indices and some securities have no fundamentals — degrade gracefully.
  }

  let news: NewsItem[] = [];
  try {
    news = (await getNews(`${fundamentals?.name ?? symbol} stock`)).slice(0, 25);
  } catch {
    // News source down — sentiment factor is skipped.
  }

  const sentiment = scoreNewsSentiment(news);

  const factors: AnalysisFactor[] = [...technicalFactors(technicals)];
  const ff = fundamentalFactor(fundamentals);
  if (ff) factors.push(ff);
  const af = analystFactor(fundamentals, technicals.last);
  if (af) factors.push(af);
  if (news.length > 0) {
    factors.push({
      name: "News sentiment",
      score: clamp(sentiment.score),
      weight: 0.15,
      detail: `${sentiment.positive} bullish vs ${sentiment.negative} bearish of ${news.length} recent headlines.`,
    });
  }

  // Re-normalize weights over the factors that actually exist.
  const totalWeight = factors.reduce((a, f) => a + f.weight, 0);
  const compositeScore = clamp(
    factors.reduce((a, f) => a + f.score * (f.weight / totalWeight), 0)
  );

  const verdict: Verdict = compositeScore > 0.2 ? "BUY" : compositeScore < -0.2 ? "SELL" : "HOLD";

  // Confidence: strength of signal + agreement between factors.
  const agreeing = factors.filter((f) => Math.sign(f.score) === Math.sign(compositeScore)).length;
  const agreement = factors.length ? agreeing / factors.length : 0;
  const confidence =
    Math.abs(compositeScore) > 0.35 && agreement > 0.7
      ? "high"
      : Math.abs(compositeScore) > 0.15 && agreement > 0.5
        ? "medium"
        : "low";

  const upside = fundamentals?.targetMeanPrice
    ? ((fundamentals.targetMeanPrice - technicals.last) / technicals.last) * 100
    : undefined;

  const llmNote = await generateNarrative({
    symbol,
    name: fundamentals?.name,
    verdict,
    compositeScore,
    factors,
    technicals,
    sentiment,
    headlines: news.slice(0, 8).map((n) => n.title),
  });

  return {
    symbol,
    verdict,
    compositeScore,
    confidence,
    factors,
    technicals,
    sentiment,
    analyst: {
      consensus: fundamentals?.recommendationKey,
      targetMeanPrice: fundamentals?.targetMeanPrice,
      upsidePercent: upside,
      numberOfAnalysts: fundamentals?.numberOfAnalysts,
    },
    narrative: llmNote ?? rulesNarrative(symbol, verdict, factors, technicals),
    narrativeSource: llmNote ? "claude" : "rules",
    generatedAt: Date.now(),
  };
}
