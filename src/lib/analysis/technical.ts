import type { Candle } from "@/types/market";

export interface TechnicalIndicators {
  last: number;
  sma20?: number;
  sma50?: number;
  sma200?: number;
  rsi14?: number;
  macdHistogram?: number;
  return1M?: number;
  return3M?: number;
  return6M?: number;
  annualizedVolatility?: number;
  volumeRatio?: number; // 5d avg vs 20d avg
  support?: number;
  resistance?: number;
  pctFrom52wHigh?: number;
  pctFrom52wLow?: number;
}

function sma(values: number[], period: number): number | undefined {
  if (values.length < period) return undefined;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  values.forEach((v, i) => {
    out.push(i === 0 ? v : v * k + out[i - 1] * (1 - k));
  });
  return out;
}

function rsi(closes: number[], period = 14): number | undefined {
  if (closes.length < period + 1) return undefined;
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss -= diff;
  }
  avgGain /= period;
  avgLoss /= period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

function pctReturn(closes: number[], tradingDays: number): number | undefined {
  if (closes.length <= tradingDays) return undefined;
  const past = closes[closes.length - 1 - tradingDays];
  return ((closes[closes.length - 1] - past) / past) * 100;
}

/** Compute the indicator set from daily candles (expects ~1y of history). */
export function computeIndicators(candles: Candle[]): TechnicalIndicators | null {
  if (candles.length < 30) return null;
  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume ?? 0);
  const last = closes[closes.length - 1];

  // MACD(12, 26) histogram vs its 9-period signal line.
  let macdHistogram: number | undefined;
  if (closes.length >= 35) {
    const macdLine = ema(closes, 12).map((v, i) => v - ema(closes, 26)[i]);
    const signal = ema(macdLine.slice(26), 9);
    macdHistogram =
      macdLine[macdLine.length - 1] - signal[signal.length - 1];
  }

  // Daily-return volatility, annualized.
  const returns = closes.slice(1).map((c, i) => (c - closes[i]) / closes[i]);
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
  const annualizedVolatility = Math.sqrt(variance) * Math.sqrt(252) * 100;

  const recent = closes.slice(-60);
  const vol20 = sma(volumes, 20);
  const vol5 = sma(volumes, 5);
  const yearHigh = Math.max(...closes);
  const yearLow = Math.min(...closes);

  return {
    last,
    sma20: sma(closes, 20),
    sma50: sma(closes, 50),
    sma200: sma(closes, 200),
    rsi14: rsi(closes),
    macdHistogram,
    return1M: pctReturn(closes, 21),
    return3M: pctReturn(closes, 63),
    return6M: pctReturn(closes, 126),
    annualizedVolatility,
    volumeRatio: vol20 && vol5 ? vol5 / vol20 : undefined,
    support: Math.min(...recent),
    resistance: Math.max(...recent),
    pctFrom52wHigh: ((last - yearHigh) / yearHigh) * 100,
    pctFrom52wLow: ((last - yearLow) / yearLow) * 100,
  };
}
