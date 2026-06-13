import {
  TRADEABLE_INDICES,
  type IntradayAnalysis,
  type IntradayLevels,
  type TradeableIndex,
  type TradePlan,
} from "@/lib/analysis/intraday-types";
import { getChart, getMarketStatus } from "@/lib/market";
import type { Candle } from "@/types/market";

/**
 * Intraday levels + trade-plan engine for index derivatives.
 * Indices carry no volume on free feeds, so the toolkit is the classic
 * index-scalper set: floor-trader pivots, CPR, opening range, 20-EMA bias.
 * Config and result types live in intraday-types.ts (client-safe).
 */

function istDay(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
}

function groupBySession(candles: Candle[]): Array<{ date: string; candles: Candle[] }> {
  const groups: Array<{ date: string; candles: Candle[] }> = [];
  for (const c of candles) {
    const date = istDay(c.time);
    const last = groups[groups.length - 1];
    if (last && last.date === date) last.candles.push(c);
    else groups.push({ date, candles: [c] });
  }
  return groups;
}

function ema(values: number[], period: number): number | undefined {
  if (values.length < period) return undefined;
  const k = 2 / (period + 1);
  let e = values[0];
  for (let i = 1; i < values.length; i++) e = values[i] * k + e * (1 - k);
  return e;
}

const round = (n: number) => Math.round(n * 100) / 100;

export async function buildIntradayAnalysis(key: string): Promise<IntradayAnalysis> {
  const idx = TRADEABLE_INDICES.find((i) => i.key === key.toUpperCase());
  if (!idx) throw new Error(`Unknown tradeable index: ${key}`);

  const [chart, status] = await Promise.all([
    getChart(idx.symbol, "5d", "5m"),
    getMarketStatus().catch(() => null),
  ]);
  const sessions = groupBySession(chart.candles);
  if (sessions.length < 2) throw new Error("Insufficient intraday history");

  const marketOpen = status?.isOpen ?? false;
  // During market hours the last group is the live session and pivots come
  // from the prior day. When closed, the last full session becomes the basis
  // for the NEXT session's levels.
  const current = marketOpen ? sessions[sessions.length - 1] : null;
  const basis = marketOpen ? sessions[sessions.length - 2] : sessions[sessions.length - 1];

  const bHigh = Math.max(...basis.candles.map((c) => c.high));
  const bLow = Math.min(...basis.candles.map((c) => c.low));
  const bClose = basis.candles[basis.candles.length - 1].close;

  const pivot = (bHigh + bLow + bClose) / 3;
  const bc = (bHigh + bLow) / 2;
  const tc = 2 * pivot - bc;
  const range = bHigh - bLow;

  const display = current ?? sessions[sessions.length - 1];
  const closes = display.candles.map((c) => c.close);
  const last = closes[closes.length - 1];
  const prevCloseForChange = marketOpen
    ? bClose
    : sessions[sessions.length - 2].candles.at(-1)!.close;

  const orCandles = current?.candles.slice(0, 3); // first 3 × 5m = 15 min
  const levels: IntradayLevels = {
    pivot: round(pivot),
    bc: round(Math.min(bc, tc)),
    tc: round(Math.max(bc, tc)),
    r1: round(2 * pivot - bLow),
    r2: round(pivot + range),
    r3: round(bHigh + 2 * (pivot - bLow)),
    s1: round(2 * pivot - bHigh),
    s2: round(pivot - range),
    s3: round(bLow - 2 * (bHigh - pivot)),
    orHigh: orCandles ? round(Math.max(...orCandles.map((c) => c.high))) : undefined,
    orLow: orCandles ? round(Math.min(...orCandles.map((c) => c.low))) : undefined,
    dayHigh: current ? round(Math.max(...current.candles.map((c) => c.high))) : undefined,
    dayLow: current ? round(Math.min(...current.candles.map((c) => c.low))) : undefined,
    ema20: ema(closes, 20) ? round(ema(closes, 20)!) : undefined,
  };

  // Bias: price vs pivot/CPR and the 5-minute 20-EMA.
  const abovePivot = last > pivot;
  const aboveEma = levels.ema20 === undefined || last > levels.ema20;
  const aboveCpr = last > levels.tc;
  const belowCpr = last < levels.bc;
  let bias: IntradayAnalysis["bias"];
  let biasReason: string;
  if (abovePivot && aboveEma && aboveCpr) {
    bias = "bullish";
    biasReason = "Price is above the central pivot, above the CPR band, and holding over the 5-min 20-EMA.";
  } else if (!abovePivot && !aboveEma && belowCpr) {
    bias = "bearish";
    biasReason = "Price is below the central pivot, below the CPR band, and under the 5-min 20-EMA.";
  } else {
    bias = "neutral";
    biasReason = "Price is inside or chopping around the CPR/pivot zone · no clean directional edge yet.";
  }

  const narrow = (tc - bc) / pivot < 0.0015; // narrow CPR → trend-day potential

  let plan: TradePlan;
  if (bias === "bullish") {
    const entry = round(Math.max(last, levels.orHigh ?? last));
    const stop = round(Math.max(levels.bc, levels.orLow ?? levels.s1, levels.s1));
    const target1 = round(entry < levels.r1 ? levels.r1 : levels.r2);
    const target2 = round(target1 === levels.r1 ? levels.r2 : levels.r3);
    plan = buildPlanNumbers("LONG", idx, entry, stop, target1, target2,
      `Go long ${idx.derivative} futures (or an at-the-money call) on strength above ${entry.toFixed(0)}. ` +
      `${narrow ? "Narrow CPR suggests trend-day potential. " : ""}Trail to breakeven once Target 1 is hit.`);
  } else if (bias === "bearish") {
    const entry = round(Math.min(last, levels.orLow ?? last));
    const stop = round(Math.min(levels.tc, levels.orHigh ?? levels.r1, levels.r1));
    const target1 = round(entry > levels.s1 ? levels.s1 : levels.s2);
    const target2 = round(target1 === levels.s1 ? levels.s2 : levels.s3);
    plan = buildPlanNumbers("SHORT", idx, entry, stop, target1, target2,
      `Go short ${idx.derivative} futures (or an at-the-money put) on weakness below ${entry.toFixed(0)}. ` +
      `${narrow ? "Narrow CPR suggests trend-day potential. " : ""}Trail to breakeven once Target 1 is hit.`);
  } else {
    // Range framework: long off S1, short off R1, until a CPR breakout.
    const entry = round(levels.tc);
    const stop = round(levels.bc);
    plan = buildPlanNumbers("WAIT", idx, entry, stop, round(levels.r1), round(levels.r2),
      `No directional edge inside the CPR. Wait for a 5-min close above ${levels.tc.toFixed(0)} (then long toward R1) ` +
      `or below ${levels.bc.toFixed(0)} (then short toward S1). Avoid trading inside the band.`);
  }

  return {
    key: idx.key,
    label: idx.label,
    derivative: idx.derivative,
    last: round(last),
    changePercent: round(((last - prevCloseForChange) / prevCloseForChange) * 100),
    marketOpen,
    basisSession: { date: basis.date, high: round(bHigh), low: round(bLow), close: round(bClose) },
    levels,
    bias,
    biasReason,
    plan,
    candles: display.candles,
    generatedAt: Date.now(),
  };
}

function buildPlanNumbers(
  direction: TradePlan["direction"],
  idx: TradeableIndex,
  entry: number,
  stop: number,
  target1: number,
  target2: number,
  comment: string
): TradePlan {
  const sign = direction === "SHORT" ? -1 : 1;
  const riskPoints = round(Math.abs(entry - stop));
  const rewardPoints = round(Math.abs(target1 - entry));
  return {
    direction,
    instrument:
      direction === "LONG"
        ? `${idx.derivative} futures (long) or ATM call option`
        : direction === "SHORT"
          ? `${idx.derivative} futures (short) or ATM put option`
          : `${idx.derivative} futures / options · wait for breakout`,
    lotSize: idx.lotSize,
    entry,
    stop,
    target1,
    target2,
    riskPoints,
    rewardPoints,
    rrRatio: riskPoints > 0 ? round(rewardPoints / riskPoints) : 0,
    profitAtT1PerLot: round(sign * (target1 - entry) * idx.lotSize),
    profitAtT2PerLot: round(sign * (target2 - entry) * idx.lotSize),
    lossAtStopPerLot: round(Math.abs(entry - stop) * idx.lotSize),
    comment,
  };
}
