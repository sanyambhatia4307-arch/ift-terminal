import { getAiAnalysis } from "@/lib/analysis/ai";
import { detectShape, type ChartShape } from "@/lib/analysis/patterns";
import { computeIndicators } from "@/lib/analysis/technical";
import { getChart } from "@/lib/market";
import type { EnsembleModelView } from "@/lib/analysis/llm";

/**
 * Forward projection for daily charts, expressed as concrete base / bull / bear
 * target prices over a chosen horizon. The path is driven by the dual-model AI
 * ensemble (averaged) and bounded by the detected chart pattern; a plain
 * sentence explains it. Orientation, not a guarantee.
 */

export interface DetectedPattern {
  name: string;
  signal: "bullish" | "bearish" | "neutral";
  detail: string;
}

export interface ProjectionPoint {
  time: number; // epoch seconds (future trading session)
  base: number;
  bull: number;
  bear: number;
}

export interface ForecastResult {
  symbol: string;
  horizonDays: number;
  source: "ensemble" | "free" | "none";
  last: number;
  basePct: number;
  bullPct: number;
  bearPct: number;
  baseTarget: number;
  bullTarget: number;
  bearTarget: number;
  confidence: number;
  modelViews: EnsembleModelView[];
  shape: ChartShape | null;
  patterns: DetectedPattern[];
  projection: ProjectionPoint[];
  summary: string;
  sentimentScore: number;
  generatedAt: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

function nextTradingDay(epochSec: number): number {
  let t = epochSec + 86400;
  let day = new Date(t * 1000).getUTCDay();
  while (day === 0 || day === 6) {
    t += 86400;
    day = new Date(t * 1000).getUTCDay();
  }
  return t;
}

export async function buildForecast(symbol: string, horizonDays: number): Promise<ForecastResult> {
  const chart = await getChart(symbol, "1y", "1d");
  const candles = chart.candles;
  const t = computeIndicators(candles);
  if (!t || candles.length < 60) throw new Error("Insufficient history for projection");

  const shape = detectShape(candles);
  const ai = await getAiAnalysis(symbol).catch(() => null);

  // Scale the AI's ~45-session view to the requested horizon; fall back to a
  // momentum + volatility estimate when no model output is available.
  let basePct: number;
  let bullPct: number;
  let bearPct: number;
  let source: ForecastResult["source"] = "none";
  let confidence = 0;

  if (ai && ai.source !== "none") {
    const f = horizonDays / ai.horizonSessions;
    basePct = ai.baseReturnPct * f;
    bullPct = ai.bullReturnPct * f;
    bearPct = ai.bearReturnPct * f;
    source = ai.source;
    confidence = ai.confidence;
  } else {
    const mom =
      0.5 * ((t.return3M ?? 0) / 63) + 0.3 * ((t.return1M ?? 0) / 21) + 0.2 * ((t.return6M ?? 0) / 126);
    basePct = clamp(mom * horizonDays, -25, 25);
    const sigma = (t.annualizedVolatility ?? 25) * Math.sqrt(horizonDays / 252);
    bullPct = basePct + sigma;
    bearPct = basePct - sigma;
  }

  // Keep bull >= base >= bear sane.
  bullPct = Math.max(bullPct, basePct + 0.5);
  bearPct = Math.min(bearPct, basePct - 0.5);

  const last = t.last;
  const baseTarget = round2(last * (1 + basePct / 100));
  const bullTarget = round2(last * (1 + bullPct / 100));
  const bearTarget = round2(last * (1 + bearPct / 100));

  // Projection cone: linear glide from today to each horizon target.
  const projection: ProjectionPoint[] = [];
  let time = candles[candles.length - 1].time;
  for (let d = 1; d <= horizonDays; d++) {
    time = nextTradingDay(time);
    const f = d / horizonDays;
    projection.push({
      time,
      base: round2(last * (1 + (basePct * f) / 100)),
      bull: round2(last * (1 + (bullPct * f) / 100)),
      bear: round2(last * (1 + (bearPct * f) / 100)),
    });
  }

  // Indicator pattern chips (kept alongside the geometric shape).
  const sentimentScore = ai?.sentiment ?? 0;
  const patterns = indicatorPatterns(t, sentimentScore);

  const months = Math.round((horizonDays / 21) * 10) / 10;
  const dir = basePct >= 0 ? "+" : "";
  const summary =
    `${source === "ensemble" ? "Both AI models" : source === "free" ? "The AI model" : "A momentum model"} ` +
    `project about ${dir}${basePct.toFixed(1)}% over the next ~${months} months, a base target near ` +
    `₹${baseTarget.toFixed(0)}. Bull case ₹${bullTarget.toFixed(0)} (+${bullPct.toFixed(1)}%), bear case ` +
    `₹${bearTarget.toFixed(0)} (${bearPct.toFixed(1)}%).` +
    (shape ? ` Chart shape: ${shape.shape}. ${shape.expectation}` : "");

  return {
    symbol,
    horizonDays,
    source,
    last: round2(last),
    basePct: round2(basePct),
    bullPct: round2(bullPct),
    bearPct: round2(bearPct),
    baseTarget,
    bullTarget,
    bearTarget,
    confidence,
    modelViews: ai?.models ?? [],
    shape,
    patterns,
    projection,
    summary,
    sentimentScore: round2(sentimentScore),
    generatedAt: Date.now(),
  };
}

function indicatorPatterns(
  t: NonNullable<ReturnType<typeof computeIndicators>>,
  sentimentScore: number
): DetectedPattern[] {
  const p: DetectedPattern[] = [];
  if (t.sma50 && t.sma200) {
    const golden = t.sma50 > t.sma200;
    p.push({
      name: golden ? "Golden-cross regime" : "Death-cross regime",
      signal: golden ? "bullish" : "bearish",
      detail: `50-DMA ${golden ? "above" : "below"} 200-DMA.`,
    });
  }
  if (t.rsi14 !== undefined) {
    if (t.rsi14 > 70) p.push({ name: "Overbought (RSI)", signal: "bearish", detail: `RSI ${t.rsi14.toFixed(0)}; pullback risk.` });
    else if (t.rsi14 < 30) p.push({ name: "Oversold (RSI)", signal: "bullish", detail: `RSI ${t.rsi14.toFixed(0)}; bounce-prone.` });
  }
  if (t.macdHistogram !== undefined)
    p.push({
      name: t.macdHistogram > 0 ? "MACD momentum up" : "MACD momentum down",
      signal: t.macdHistogram > 0 ? "bullish" : "bearish",
      detail: `MACD histogram ${t.macdHistogram > 0 ? "positive" : "negative"}.`,
    });
  if (t.pctFrom52wHigh !== undefined && t.pctFrom52wHigh > -3)
    p.push({ name: "52-week breakout watch", signal: "bullish", detail: "Within 3% of the 52-week high." });
  if (t.volumeRatio !== undefined && t.volumeRatio > 1.4)
    p.push({ name: "Volume surge", signal: "neutral", detail: `5-day volume ${((t.volumeRatio - 1) * 100).toFixed(0)}% above norm.` });
  if (Math.abs(sentimentScore) > 0.25)
    p.push({
      name: sentimentScore > 0 ? "Bullish news flow" : "Bearish news flow",
      signal: sentimentScore > 0 ? "bullish" : "bearish",
      detail: `Headlines skew ${sentimentScore > 0 ? "positive" : "negative"}.`,
    });
  return p;
}
