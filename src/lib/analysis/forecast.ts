import { computeIndicators } from "@/lib/analysis/technical";
import { scoreNewsSentiment } from "@/lib/analysis/sentiment";
import { getChart, getFundamentals, getNews } from "@/lib/market";

/**
 * Pattern read + forward projection for daily charts.
 *
 * Patterns are detected from price/volume structure; the projection drifts
 * the last price forward using a transparent blend of momentum, news
 * sentiment and analyst-target pull, with a ±1σ volatility cone. It is a
 * statistical extrapolation for orientation — not a price prediction.
 */

export interface DetectedPattern {
  name: string;
  signal: "bullish" | "bearish" | "neutral";
  detail: string;
}

export interface ProjectionPoint {
  time: number; // epoch seconds (future trading days)
  mid: number;
  upper: number;
  lower: number;
}

export interface ForecastResult {
  symbol: string;
  horizonDays: number;
  driftDailyPct: number;
  sentimentScore: number;
  patterns: DetectedPattern[];
  projection: ProjectionPoint[];
  generatedAt: number;
}

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

  // Sentiment + analyst pull (both served from existing caches).
  let sentimentScore = 0;
  let analystUpsidePct: number | undefined;
  let name: string | undefined;
  try {
    const f = await getFundamentals(symbol);
    name = f.name;
    if (f.targetMeanPrice) analystUpsidePct = ((f.targetMeanPrice - t.last) / t.last) * 100;
  } catch {
    // indices/ETFs — no fundamentals
  }
  try {
    const news = (await getNews(`${name ?? symbol} stock`)).slice(0, 25);
    sentimentScore = scoreNewsSentiment(news).score;
  } catch {
    // news down — purely technical projection
  }

  /* ---- Pattern detection ---- */
  const patterns: DetectedPattern[] = [];
  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

  if (t.sma50 && t.sma200) {
    const golden = t.sma50 > t.sma200;
    patterns.push({
      name: golden ? "Golden-cross regime" : "Death-cross regime",
      signal: golden ? "bullish" : "bearish",
      detail: `50-DMA ${golden ? "above" : "below"} 200-DMA — ${golden ? "structural uptrend" : "structural downtrend"}.`,
    });
    const above200 = t.last > t.sma200;
    patterns.push({
      name: above200 ? "Above 200-DMA" : "Below 200-DMA",
      signal: above200 ? "bullish" : "bearish",
      detail: `Price ${(((t.last - t.sma200) / t.sma200) * 100).toFixed(1)}% ${above200 ? "above" : "below"} the long-term average.`,
    });
  }

  // Swing structure over the last ~40 bars: higher-highs/higher-lows?
  if (candles.length >= 40) {
    const win = 40;
    const h1 = Math.max(...highs.slice(-win, -win / 2));
    const h2 = Math.max(...highs.slice(-win / 2));
    const l1 = Math.min(...lows.slice(-win, -win / 2));
    const l2 = Math.min(...lows.slice(-win / 2));
    if (h2 > h1 && l2 > l1) {
      patterns.push({
        name: "Ascending channel",
        signal: "bullish",
        detail: "Higher highs and higher lows over the last two months.",
      });
    } else if (h2 < h1 && l2 < l1) {
      patterns.push({
        name: "Descending channel",
        signal: "bearish",
        detail: "Lower highs and lower lows over the last two months.",
      });
    } else if (h2 < h1 && l2 > l1) {
      patterns.push({
        name: "Symmetrical squeeze",
        signal: "neutral",
        detail: "Range is compressing — breakouts from squeezes tend to travel.",
      });
    }
  }

  if (t.rsi14 !== undefined) {
    if (t.rsi14 > 70)
      patterns.push({ name: "Overbought (RSI)", signal: "bearish", detail: `RSI ${t.rsi14.toFixed(0)} — stretched; pullback risk elevated.` });
    else if (t.rsi14 < 30)
      patterns.push({ name: "Oversold (RSI)", signal: "bullish", detail: `RSI ${t.rsi14.toFixed(0)} — washed out; bounce-prone zone.` });
  }
  if (t.macdHistogram !== undefined) {
    patterns.push({
      name: t.macdHistogram > 0 ? "MACD momentum up" : "MACD momentum down",
      signal: t.macdHistogram > 0 ? "bullish" : "bearish",
      detail: "MACD histogram " + (t.macdHistogram > 0 ? "positive." : "negative."),
    });
  }
  if (t.pctFrom52wHigh !== undefined && t.pctFrom52wHigh > -3) {
    patterns.push({
      name: "52-week breakout watch",
      signal: "bullish",
      detail: "Within 3% of the 52-week high — fresh highs attract momentum flows.",
    });
  }
  if (t.support && Math.abs(t.last - t.support) / t.last < 0.02) {
    patterns.push({
      name: "Testing support",
      signal: "neutral",
      detail: `Sitting on the ₹${t.support.toFixed(0)} support shelf — hold or break decides the next leg.`,
    });
  }
  if (t.resistance && Math.abs(t.last - t.resistance) / t.last < 0.02) {
    patterns.push({
      name: "Testing resistance",
      signal: "neutral",
      detail: `Pressing the ₹${t.resistance.toFixed(0)} ceiling — a close above opens room higher.`,
    });
  }
  if (t.volumeRatio !== undefined && t.volumeRatio > 1.4) {
    patterns.push({
      name: "Volume surge",
      signal: "neutral",
      detail: `5-day volume running ${((t.volumeRatio - 1) * 100).toFixed(0)}% above the 20-day norm — conviction behind the current move.`,
    });
  }
  if (Math.abs(sentimentScore) > 0.25) {
    patterns.push({
      name: sentimentScore > 0 ? "Bullish news flow" : "Bearish news flow",
      signal: sentimentScore > 0 ? "bullish" : "bearish",
      detail: "Recent headlines skew " + (sentimentScore > 0 ? "positive." : "negative."),
    });
  }

  /* ---- Projection ---- */
  const ret = (days: number, value?: number) =>
    value !== undefined ? value / 100 / days : 0;
  const momentumDrift =
    0.4 * ret(63, t.return3M) + 0.3 * ret(21, t.return1M) + 0.3 * ret(126, t.return6M);
  const sentimentDrift = sentimentScore * 0.0006;
  const analystDrift =
    analystUpsidePct !== undefined ? clamp(analystUpsidePct / 100 / 252, -0.0006, 0.0006) : 0;
  const drift = clamp(momentumDrift * 0.6 + sentimentDrift + analystDrift, -0.0035, 0.0035);

  const sigmaDaily = (t.annualizedVolatility ?? 25) / 100 / Math.sqrt(252);
  const lastCandle = candles[candles.length - 1];

  const projection: ProjectionPoint[] = [];
  let time = lastCandle.time;
  for (let d = 1; d <= horizonDays; d++) {
    time = nextTradingDay(time);
    const mid = t.last * Math.pow(1 + drift, d);
    const band = mid * sigmaDaily * Math.sqrt(d);
    projection.push({
      time,
      mid: Math.round(mid * 100) / 100,
      upper: Math.round((mid + band) * 100) / 100,
      lower: Math.round((mid - band) * 100) / 100,
    });
  }

  return {
    symbol,
    horizonDays,
    driftDailyPct: Math.round(drift * 10000) / 100,
    sentimentScore: Math.round(sentimentScore * 100) / 100,
    patterns,
    projection,
    generatedAt: Date.now(),
  };
}
