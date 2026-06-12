import type { Candle } from "@/types/market";

/** Client-safe config + types for the intraday engine (no server imports). */

export interface TradeableIndex {
  key: string;
  label: string;
  symbol: string; // app/Yahoo-resolvable symbol
  derivative: string;
  lotSize: number;
}

export const TRADEABLE_INDICES: TradeableIndex[] = [
  { key: "NIFTY", label: "NIFTY 50", symbol: "^NSEI", derivative: "NIFTY", lotSize: 75 },
  { key: "BANKNIFTY", label: "NIFTY BANK", symbol: "^NSEBANK", derivative: "BANKNIFTY", lotSize: 35 },
  { key: "FINNIFTY", label: "NIFTY FIN SERVICE", symbol: "NIFTY_FIN_SERVICE.NS", derivative: "FINNIFTY", lotSize: 65 },
  { key: "MIDCPNIFTY", label: "NIFTY MIDCAP SELECT", symbol: "NIFTY_MID_SELECT.NS", derivative: "MIDCPNIFTY", lotSize: 140 },
  { key: "SENSEX", label: "SENSEX", symbol: "^BSESN", derivative: "SENSEX (BSE)", lotSize: 20 },
];

export interface IntradayLevels {
  pivot: number;
  bc: number; // CPR bottom
  tc: number; // CPR top
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
  orHigh?: number; // opening range (first 15 min)
  orLow?: number;
  dayHigh?: number;
  dayLow?: number;
  ema20?: number;
}

export interface TradePlan {
  direction: "LONG" | "SHORT" | "WAIT";
  instrument: string;
  lotSize: number;
  entry: number;
  stop: number;
  target1: number;
  target2: number;
  riskPoints: number;
  rewardPoints: number;
  rrRatio: number;
  profitAtT1PerLot: number;
  profitAtT2PerLot: number;
  lossAtStopPerLot: number;
  comment: string;
}

export interface IntradayAnalysis {
  key: string;
  label: string;
  derivative: string;
  last: number;
  changePercent: number;
  marketOpen: boolean;
  basisSession: { date: string; high: number; low: number; close: number };
  levels: IntradayLevels;
  bias: "bullish" | "bearish" | "neutral";
  biasReason: string;
  plan: TradePlan;
  candles: Candle[]; // current/last session 5m candles for the chart
  generatedAt: number;
}
