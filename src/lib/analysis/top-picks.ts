import { computeIndicators } from "@/lib/analysis/technical";
import { cached } from "@/lib/cache";
import { NIFTY50 } from "@/lib/data/nifty50";
import { getChart } from "@/lib/market";

export interface TopPick {
  symbol: string;
  name: string;
  sector: string;
  last: number;
  score: number; // -1..1 technical composite
  return1M?: number;
  return3M?: number;
  rsi14?: number;
  rationale: string;
}

const clamp = (n: number) => Math.max(-1, Math.min(1, n));

/**
 * Technical-only ranking across the NIFTY 50 universe. Uses cached daily
 * charts (one Yahoo call per symbol, 30-min cache) · fundamentals and news
 * are deliberately excluded here to keep the scan cheap; the full Signal
 * Engine runs on the stock page.
 */
async function scoreSymbol(c: (typeof NIFTY50)[number]): Promise<TopPick | null> {
  try {
    const chart = await getChart(c.symbol, "1y", "1d");
    const t = computeIndicators(chart.candles);
    if (!t) return null;

    let score = 0;
    const reasons: string[] = [];

    if (t.sma50 && t.sma200) {
      const trend =
        (t.last > t.sma50 ? 0.2 : -0.2) +
        (t.last > t.sma200 ? 0.15 : -0.15) +
        (t.sma50 > t.sma200 ? 0.15 : -0.15);
      score += trend;
      if (trend > 0.3) reasons.push("strong uptrend above 50/200-DMA");
      else if (trend < -0.3) reasons.push("downtrend below key averages");
    }
    if (t.return3M !== undefined) {
      score += clamp(t.return3M / 25) * 0.25;
      if (t.return3M > 10) reasons.push(`+${t.return3M.toFixed(0)}% over 3M`);
    }
    if (t.rsi14 !== undefined) {
      if (t.rsi14 < 32) {
        score += 0.15;
        reasons.push(`oversold (RSI ${t.rsi14.toFixed(0)})`);
      } else if (t.rsi14 > 72) {
        score -= 0.15;
        reasons.push(`overbought (RSI ${t.rsi14.toFixed(0)})`);
      }
    }
    if (t.macdHistogram !== undefined) {
      score += t.macdHistogram > 0 ? 0.1 : -0.1;
    }
    if (t.pctFrom52wHigh !== undefined && t.pctFrom52wHigh > -5) {
      reasons.push("near 52-week high");
    }

    return {
      symbol: c.symbol,
      name: c.name,
      sector: c.sector,
      last: t.last,
      score: clamp(score),
      return1M: t.return1M,
      return3M: t.return3M,
      rsi14: t.rsi14,
      rationale: reasons.slice(0, 2).join("; ") || "mixed technical picture",
    };
  } catch {
    return null;
  }
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (i < items.length) {
        const idx = i++;
        results[idx] = await fn(items[idx]);
      }
    })
  );
  return results;
}

export function getTopPicks(count = 6): Promise<TopPick[]> {
  return cached("top-picks", 30 * 60 * 1000, async () => {
    const scored = await mapLimit(NIFTY50, 6, scoreSymbol);
    return scored
      .filter((p): p is TopPick => p !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  });
}
