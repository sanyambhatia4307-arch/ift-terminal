import type { Candle } from "@/types/market";

/**
 * Geometric chart-pattern detector.
 *
 * Extracts swing pivots, fits trendlines through the recent highs and lows,
 * and classifies the shape (triangles, wedges, channels, ranges, double
 * tops/bottoms). Returns the trendline endpoints so the chart can draw them as
 * helper lines, plus a measured-move target and a plain expectation.
 */

export interface TrendLine {
  p1: { time: number; price: number };
  p2: { time: number; price: number };
}

export interface ChartShape {
  shape: string;
  signal: "bullish" | "bearish" | "neutral";
  confidence: "low" | "medium" | "high";
  description: string;
  expectation: string;
  resistance?: TrendLine;
  support?: TrendLine;
  targetPrice?: number; // measured-move objective on breakout
  targetPct?: number;
  breakoutLevel?: number; // the price a decisive close must clear to trigger
  breakoutDirection?: "up" | "down";
  apexTime?: number; // where the rails are projected to converge / break
}

interface Pivot {
  i: number;
  time: number;
  price: number;
}

function pivots(candles: Candle[], k: number, kind: "high" | "low"): Pivot[] {
  const out: Pivot[] = [];
  for (let i = k; i < candles.length - k; i++) {
    const v = kind === "high" ? candles[i].high : candles[i].low;
    let isPivot = true;
    for (let j = i - k; j <= i + k; j++) {
      if (j === i) continue;
      const w = kind === "high" ? candles[j].high : candles[j].low;
      if (kind === "high" ? w > v : w < v) {
        isPivot = false;
        break;
      }
    }
    if (isPivot) out.push({ i, time: candles[i].time, price: v });
  }
  return out;
}

/** Least-squares line over (index, price). */
function fit(points: Pivot[]): { slope: number; intercept: number } | null {
  if (points.length < 2) return null;
  const n = points.length;
  const sx = points.reduce((a, p) => a + p.i, 0);
  const sy = points.reduce((a, p) => a + p.price, 0);
  const sxx = points.reduce((a, p) => a + p.i * p.i, 0);
  const sxy = points.reduce((a, p) => a + p.i * p.price, 0);
  const denom = n * sxx - sx * sx;
  if (Math.abs(denom) < 1e-9) return null;
  const slope = (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  return { slope, intercept };
}

export function detectShape(candles: Candle[]): ChartShape | null {
  if (candles.length < 60) return null;
  const win = Math.min(candles.length, 120);
  const seg = candles.slice(-win);
  const last = seg[seg.length - 1].close;
  const lastTime = seg[seg.length - 1].time;

  const ph = pivots(seg, 5, "high");
  const pl = pivots(seg, 5, "low");
  if (ph.length < 2 || pl.length < 2) return null;

  const rf = fit(ph);
  const sf = fit(pl);
  if (!rf || !sf) return null;

  // Slope as % of price per bar (normalised so thresholds are scale-free).
  const resSlope = (rf.slope / last) * 100;
  const supSlope = (sf.slope / last) * 100;
  const FLAT = 0.04; // %/bar

  const lineAt = (f: { slope: number; intercept: number }, i: number) => f.slope * i + f.intercept;
  const startI = Math.min(ph[0].i, pl[0].i);
  const endI = seg.length - 1;

  // Project the rails forward so the breakout / apex zone is visible on-chart.
  const steps: number[] = [];
  for (let i = 1; i < seg.length; i++) steps.push(seg[i].time - seg[i - 1].time);
  steps.sort((a, b) => a - b);
  const medStep = steps[Math.floor(steps.length / 2)] || 86400;
  const EXT = Math.round(win * 0.18); // extend ~18% of the window into the future
  const fwdI = endI + EXT;
  const fwdTime = lastTime + EXT * medStep;

  const resistance: TrendLine = {
    p1: { time: seg[startI].time, price: lineAt(rf, startI) },
    p2: { time: fwdTime, price: lineAt(rf, fwdI) },
  };
  const support: TrendLine = {
    p1: { time: seg[startI].time, price: lineAt(sf, startI) },
    p2: { time: fwdTime, price: lineAt(sf, fwdI) },
  };

  // Pattern height for measured moves (band width at the right edge).
  const widthNow = lineAt(rf, endI) - lineAt(sf, endI);
  const widthStart = lineAt(rf, startI) - lineAt(sf, startI);
  const converging = Math.abs(widthNow) < Math.abs(widthStart) * 0.7;
  const height = Math.abs(widthStart);

  const resUp = resSlope > FLAT;
  const resDn = resSlope < -FLAT;
  const resFlat = !resUp && !resDn;
  const supUp = supSlope > FLAT;
  const supDn = supSlope < -FLAT;
  const supFlat = !supUp && !supDn;

  let shape = "Range / Rectangle";
  let signal: ChartShape["signal"] = "neutral";
  let expectation = "Trade the range edges until a decisive close beyond either boundary.";
  let target: number | undefined;
  let breakoutLevel: number | undefined;
  let breakoutDirection: "up" | "down" | undefined;
  const resAtEnd = lineAt(rf, endI);
  const supAtEnd = lineAt(sf, endI);

  // Double top / bottom take precedence when two peaks/troughs align.
  const lastTwoHighs = ph.slice(-2);
  const lastTwoLows = pl.slice(-2);
  const doubleTop =
    lastTwoHighs.length === 2 &&
    Math.abs(lastTwoHighs[0].price - lastTwoHighs[1].price) / last < 0.02 &&
    lastTwoHighs[1].i - lastTwoHighs[0].i > 8;
  const doubleBottom =
    lastTwoLows.length === 2 &&
    Math.abs(lastTwoLows[0].price - lastTwoLows[1].price) / last < 0.02 &&
    lastTwoLows[1].i - lastTwoLows[0].i > 8;

  if (doubleTop && last < lastTwoHighs[0].price) {
    shape = "Double Top";
    signal = "bearish";
    const neckline = Math.min(...pl.slice(-3).map((p) => p.price));
    target = neckline - (lastTwoHighs[0].price - neckline);
    breakoutLevel = neckline;
    breakoutDirection = "down";
    expectation = `Reversal risk: a decisive close below the ₹${neckline.toFixed(0)} neckline projects toward ₹${target.toFixed(0)}.`;
  } else if (doubleBottom && last > lastTwoLows[0].price) {
    shape = "Double Bottom";
    signal = "bullish";
    const neckline = Math.max(...ph.slice(-3).map((p) => p.price));
    target = neckline + (neckline - lastTwoLows[0].price);
    breakoutLevel = neckline;
    breakoutDirection = "up";
    expectation = `Reversal setup: a decisive close above the ₹${neckline.toFixed(0)} neckline projects toward ₹${target.toFixed(0)}.`;
  } else if (converging && resDn && supUp) {
    shape = "Symmetrical Triangle";
    const up = supSlope + resSlope >= 0;
    signal = "neutral";
    breakoutDirection = up ? "up" : "down";
    breakoutLevel = up ? resAtEnd : supAtEnd;
    target = last + (up ? height : -height);
    expectation = `Coiling toward the apex; a close ${up ? "above" : "below"} ₹${breakoutLevel.toFixed(0)} should lead, measured move ≈ ₹${Math.abs(height).toFixed(0)} to ₹${target.toFixed(0)}.`;
  } else if (resFlat && supUp) {
    shape = "Ascending Triangle";
    signal = "bullish";
    breakoutLevel = resAtEnd;
    breakoutDirection = "up";
    target = resAtEnd + height;
    expectation = `Bullish continuation; a close above ₹${resAtEnd.toFixed(0)} projects toward ₹${target.toFixed(0)}.`;
  } else if (resDn && supFlat) {
    shape = "Descending Triangle";
    signal = "bearish";
    breakoutLevel = supAtEnd;
    breakoutDirection = "down";
    target = supAtEnd - height;
    expectation = `Bearish continuation; a close below ₹${supAtEnd.toFixed(0)} projects toward ₹${target.toFixed(0)}.`;
  } else if (converging && resUp && supUp) {
    shape = "Rising Wedge";
    signal = "bearish";
    breakoutLevel = supAtEnd;
    breakoutDirection = "down";
    target = last - height;
    expectation = `Rising wedges typically resolve lower; a close below the ₹${supAtEnd.toFixed(0)} lower rail projects toward ₹${target.toFixed(0)}.`;
  } else if (converging && resDn && supDn) {
    shape = "Falling Wedge";
    signal = "bullish";
    breakoutLevel = resAtEnd;
    breakoutDirection = "up";
    target = last + height;
    expectation = `Falling wedges typically resolve higher; a close above the ₹${resAtEnd.toFixed(0)} upper rail projects toward ₹${target.toFixed(0)}.`;
  } else if (resUp && supUp) {
    shape = "Ascending Channel";
    signal = "bullish";
    breakoutLevel = supAtEnd;
    breakoutDirection = "up";
    expectation = `Uptrend channel; buy-the-dip near the ₹${supAtEnd.toFixed(0)} lower rail holds while it does, a break below it warns of a trend change.`;
  } else if (resDn && supDn) {
    shape = "Descending Channel";
    signal = "bearish";
    breakoutLevel = resAtEnd;
    breakoutDirection = "down";
    expectation = `Downtrend channel; rallies into the ₹${resAtEnd.toFixed(0)} upper rail tend to fade until a close above it breaks the trend.`;
  } else {
    // Range / Rectangle · two-sided; flag the nearer edge as the trigger.
    const distUp = Math.abs(resAtEnd - last);
    const distDn = Math.abs(last - supAtEnd);
    breakoutDirection = distUp <= distDn ? "up" : "down";
    breakoutLevel = breakoutDirection === "up" ? resAtEnd : supAtEnd;
    expectation = `Range-bound between ₹${supAtEnd.toFixed(0)} and ₹${resAtEnd.toFixed(0)}; a decisive close beyond either edge sets the next leg.`;
  }

  const touches = ph.length + pl.length;
  const confidence: ChartShape["confidence"] = touches >= 7 ? "high" : touches >= 5 ? "medium" : "low";

  const slopeWord = (s: number) => (s > FLAT ? "rising" : s < -FLAT ? "falling" : "flat");
  const description = `Resistance ${slopeWord(resSlope)}, support ${slopeWord(supSlope)} over ~${win} sessions (${ph.length} high / ${pl.length} low pivots).`;

  return {
    shape,
    signal,
    confidence,
    description,
    expectation,
    resistance,
    support,
    targetPrice: target ? Math.round(target * 100) / 100 : undefined,
    targetPct: target ? Math.round(((target - last) / last) * 10000) / 100 : undefined,
    breakoutLevel: breakoutLevel ? Math.round(breakoutLevel * 100) / 100 : undefined,
    breakoutDirection,
    apexTime: fwdTime,
  };
}
