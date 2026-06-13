import { cached } from "@/lib/cache";
import { getIndices } from "@/lib/market";
import { nseFiiDii, type FiiDiiFlow } from "@/lib/sources/nse";
import { yahooQuotes } from "@/lib/sources/yahoo";
import type { StockQuote } from "@/types/market";

/**
 * "Today in the financial world" · the pre-open sheet an institutional desk
 * scans: global equities, US futures, FX, commodities, rates, crypto,
 * institutional flows, volatility · plus rule-based anomaly detection.
 */

interface GlobalSymbol {
  symbol: string;
  label: string;
  group: "US" | "US Futures" | "Europe" | "Asia" | "FX & Rates" | "Commodities" | "Crypto";
  anomalyPct: number; // |change %| that makes it noteworthy
}

const GLOBAL_SYMBOLS: GlobalSymbol[] = [
  { symbol: "^GSPC", label: "S&P 500", group: "US", anomalyPct: 1.2 },
  { symbol: "^IXIC", label: "Nasdaq", group: "US", anomalyPct: 1.5 },
  { symbol: "^DJI", label: "Dow Jones", group: "US", anomalyPct: 1.2 },
  { symbol: "ES=F", label: "S&P Futures", group: "US Futures", anomalyPct: 1.0 },
  { symbol: "NQ=F", label: "Nasdaq Futures", group: "US Futures", anomalyPct: 1.2 },
  { symbol: "^FTSE", label: "FTSE 100", group: "Europe", anomalyPct: 1.2 },
  { symbol: "^GDAXI", label: "DAX", group: "Europe", anomalyPct: 1.4 },
  { symbol: "^N225", label: "Nikkei 225", group: "Asia", anomalyPct: 1.5 },
  { symbol: "^HSI", label: "Hang Seng", group: "Asia", anomalyPct: 1.5 },
  { symbol: "INR=X", label: "USD/INR", group: "FX & Rates", anomalyPct: 0.4 },
  { symbol: "^TNX", label: "US 10Y Yield", group: "FX & Rates", anomalyPct: 2.0 },
  { symbol: "BZ=F", label: "Brent Crude", group: "Commodities", anomalyPct: 2.5 },
  { symbol: "GC=F", label: "Gold", group: "Commodities", anomalyPct: 1.5 },
  { symbol: "BTC-USD", label: "Bitcoin", group: "Crypto", anomalyPct: 4.0 },
];

export interface GlobalQuote extends StockQuote {
  label: string;
  group: GlobalSymbol["group"];
}

export interface Anomaly {
  severity: "high" | "medium";
  text: string;
}

export interface MarketPulse {
  global: GlobalQuote[];
  flows: FiiDiiFlow[] | null;
  vix?: { last: number; changePercent: number };
  anomalies: Anomaly[];
  summary: string;
  generatedAt: number;
}

function detectAnomalies(
  global: GlobalQuote[],
  flows: FiiDiiFlow[] | null,
  vix?: { last: number; changePercent: number }
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  for (const q of global) {
    const cfg = GLOBAL_SYMBOLS.find((g) => g.symbol === q.symbol);
    if (!cfg) continue;
    if (Math.abs(q.changePercent) >= cfg.anomalyPct) {
      const dir = q.changePercent > 0 ? "up" : "down";
      anomalies.push({
        severity: Math.abs(q.changePercent) >= cfg.anomalyPct * 1.8 ? "high" : "medium",
        text: `${cfg.label} ${dir} ${Math.abs(q.changePercent).toFixed(1)}% · ${
          cfg.group === "Commodities" || cfg.group === "FX & Rates"
            ? "watch input-cost / flow sensitive sectors"
            : "global risk sentiment shifting"
        }.`,
      });
    }
  }

  if (vix) {
    if (vix.last >= 20) {
      anomalies.push({
        severity: "high",
        text: `India VIX at ${vix.last.toFixed(1)} · elevated fear; option premiums rich, expect wide intraday swings.`,
      });
    } else if (Math.abs(vix.changePercent) >= 8) {
      anomalies.push({
        severity: "medium",
        text: `India VIX moved ${vix.changePercent > 0 ? "+" : ""}${vix.changePercent.toFixed(1)}% · volatility regime shifting.`,
      });
    }
  }

  if (flows) {
    const fii = flows.find((f) => f.category.startsWith("FII"));
    const dii = flows.find((f) => f.category === "DII");
    if (fii && Math.abs(fii.netValue) >= 3000) {
      anomalies.push({
        severity: Math.abs(fii.netValue) >= 6000 ? "high" : "medium",
        text: `Heavy FII ${fii.netValue < 0 ? "selling" : "buying"}: ₹${Math.abs(fii.netValue).toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr net (${fii.date}).`,
      });
    }
    if (fii && dii && fii.netValue < -1000 && dii.netValue > 1000) {
      anomalies.push({
        severity: "medium",
        text: `Classic tug-of-war: FII selling ₹${Math.abs(fii.netValue).toFixed(0)} Cr vs DII absorbing ₹${dii.netValue.toFixed(0)} Cr · domestic flows holding the market up.`,
      });
    }
  }

  return anomalies.sort((a, b) => (a.severity === "high" ? -1 : 1) - (b.severity === "high" ? -1 : 1));
}

function buildSummary(global: GlobalQuote[], flows: FiiDiiFlow[] | null): string {
  const us = global.filter((g) => g.group === "US");
  const fut = global.filter((g) => g.group === "US Futures");
  const asia = global.filter((g) => g.group === "Asia");
  const avg = (xs: GlobalQuote[]) =>
    xs.length ? xs.reduce((a, q) => a + q.changePercent, 0) / xs.length : 0;

  const usAvg = avg(us);
  const futAvg = avg(fut);
  const asiaAvg = avg(asia);
  const crude = global.find((g) => g.symbol === "BZ=F");
  const inr = global.find((g) => g.symbol === "INR=X");
  const fii = flows?.find((f) => f.category.startsWith("FII"));

  const parts: string[] = [];
  parts.push(
    usAvg > 0.3 ? "US closed firm" : usAvg < -0.3 ? "US closed weak" : "US closed flat"
  );
  if (fut.length)
    parts.push(futAvg > 0.2 ? "futures point higher" : futAvg < -0.2 ? "futures point lower" : "futures are flat");
  if (asia.length)
    parts.push(asiaAvg > 0.3 ? "Asia trades higher" : asiaAvg < -0.3 ? "Asia trades lower" : "Asia is mixed");
  if (crude)
    parts.push(`Brent ${crude.changePercent > 0 ? "up" : "down"} ${Math.abs(crude.changePercent).toFixed(1)}%`);
  if (inr && Math.abs(inr.changePercent) > 0.15)
    parts.push(`rupee ${inr.changePercent > 0 ? "weaker" : "stronger"} vs USD`);
  if (fii)
    parts.push(`FII ${fii.netValue < 0 ? "sold" : "bought"} ₹${Math.abs(fii.netValue).toFixed(0)} Cr in the last session`);

  return parts.join("; ") + ".";
}

export function getMarketPulse(): Promise<MarketPulse> {
  return cached("market-pulse", 2 * 60 * 1000, async () => {
    const [quotes, flows, indices] = await Promise.all([
      yahooQuotes(GLOBAL_SYMBOLS.map((g) => g.symbol)),
      nseFiiDii().catch(() => null),
      getIndices().catch(() => null),
    ]);

    const global: GlobalQuote[] = quotes.map((q) => {
      const cfg = GLOBAL_SYMBOLS.find((g) => g.symbol === q.symbol)!;
      return { ...q, label: cfg.label, group: cfg.group };
    });

    const vixIdx = indices?.all.find((i) => i.symbol === "INDIA VIX");
    const vix = vixIdx ? { last: vixIdx.last, changePercent: vixIdx.changePercent } : undefined;

    const anomalies = detectAnomalies(global, flows, vix);

    return {
      global,
      flows,
      vix,
      anomalies,
      summary: buildSummary(global, flows),
      generatedAt: Date.now(),
    };
  });
}
