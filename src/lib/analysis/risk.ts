import { cached } from "@/lib/cache";
import { getChart } from "@/lib/market";

/**
 * Portfolio risk math computed from price history rather than trusted from a
 * vendor field. Beta is a 1-year daily-return regression against the NIFTY 50,
 * which is the benchmark Indian investors actually measure against (Yahoo's
 * vendor beta for .NS names is sparse and benchmark-inconsistent).
 */

const MARKET = "^NSEI";

async function dailyReturns(symbol: string): Promise<Map<number, number>> {
  const chart = await getChart(symbol, "1y", "1d");
  const c = chart.candles.filter((x) => x.close > 0);
  const out = new Map<number, number>();
  for (let i = 1; i < c.length; i++) out.set(c[i].time, c[i].close / c[i - 1].close - 1);
  return out;
}

/** 1y daily-return beta vs the NIFTY 50; null when history is too thin. */
export function getBeta(symbol: string): Promise<number | null> {
  return cached(`beta:${symbol}`, 6 * 60 * 60 * 1000, async () => {
    const [stock, mkt] = await Promise.all([dailyReturns(symbol), dailyReturns(MARKET)]);
    const xs: number[] = [];
    const ys: number[] = [];
    for (const [t, r] of stock) {
      const m = mkt.get(t);
      if (m !== undefined) {
        xs.push(m);
        ys.push(r);
      }
    }
    if (xs.length < 60) return null;
    const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
    const mx = mean(xs);
    const my = mean(ys);
    let cov = 0;
    let varx = 0;
    for (let i = 0; i < xs.length; i++) {
      cov += (xs[i] - mx) * (ys[i] - my);
      varx += (xs[i] - mx) ** 2;
    }
    if (varx === 0) return null;
    return Math.round((cov / varx) * 100) / 100;
  });
}

export async function getBetas(symbols: string[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  await Promise.all(
    symbols.map(async (s) => {
      const b = await getBeta(s).catch(() => null);
      if (b != null) out[s] = b;
    })
  );
  return out;
}
