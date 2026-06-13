import { cached } from "@/lib/cache";
import { INDEX_CONSTITUENTS } from "@/lib/data/constituents";
import { getFundamentals, getQuotes } from "@/lib/market";
import type { FundamentalsData, StockQuote } from "@/types/market";

/**
 * Equity screener engine.
 *
 * Assembles a one-row-per-name table over the curated NSE universe by merging
 * a live bulk quote (price / market cap / day change) with the cached Yahoo
 * fundamentals snapshot, then derives transparent 0-100 factor sub-scores
 * (Value / Quality / Growth / Momentum) consistent with the Investment
 * Intelligence Framework. Filtering and ranking happen client-side so the
 * payload is cached once and reused across every screen.
 */

export interface ScreenerRow {
  symbol: string;
  name: string;
  sector?: string;
  price?: number;
  changePct?: number;
  marketCap?: number; // INR
  pe?: number;
  fwdPe?: number;
  pb?: number;
  peg?: number;
  divYield?: number; // %
  roe?: number; // %
  netMargin?: number; // %
  opMargin?: number; // %
  revGrowth?: number; // % YoY
  epsGrowth?: number; // % YoY
  debtToEquity?: number; // x
  from52wHigh?: number; // % (negative = below high)
  vs200dma?: number; // % above/below 200-DMA
  beta?: number;
  valueScore?: number;
  qualityScore?: number;
  growthScore?: number;
  momentumScore?: number;
  composite?: number; // equal-weight blend of available sub-scores
}

export interface ScreenerPayload {
  rows: ScreenerRow[];
  universe: number;
  covered: number; // rows with fundamentals
  sectors: string[];
  generatedAt: number;
}

/** Distinct, liquid universe: the union of every curated index list. */
function universeSymbols(): string[] {
  const set = new Set<string>();
  for (const list of Object.values(INDEX_CONSTITUENTS)) for (const s of list) set.add(s);
  return [...set].sort();
}

/** Bounded-concurrency map so a cold fundamentals fetch does not stampede Yahoo. */
async function mapPool<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

const band = (v: number, stops: Array<[number, number]>, fallback: number) => {
  for (const [threshold, score] of stops) if (v >= threshold) return score;
  return fallback;
};

function valueScore(r: ScreenerRow): number | undefined {
  const parts: number[] = [];
  if (r.pe != null && r.pe > 0) parts.push(band(-r.pe, [[-15, 85], [-22, 68], [-32, 52], [-45, 38]], 24));
  if (r.pb != null && r.pb > 0) parts.push(band(-r.pb, [[-2, 80], [-4, 62], [-8, 45]], 30));
  if (r.peg != null && r.peg > 0) parts.push(band(-r.peg, [[-1, 85], [-1.5, 68], [-2.5, 50]], 32));
  if (r.divYield != null) parts.push(band(r.divYield, [[3, 75], [1.5, 60], [0.5, 52]], 45));
  return parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : undefined;
}

function qualityScore(r: ScreenerRow): number | undefined {
  const parts: number[] = [];
  if (r.roe != null) parts.push(band(r.roe, [[20, 90], [14, 74], [8, 55], [0, 38]], 18));
  if (r.netMargin != null) parts.push(band(r.netMargin, [[18, 86], [10, 70], [4, 52], [0, 38]], 15));
  if (r.opMargin != null) parts.push(band(r.opMargin, [[20, 84], [12, 66], [5, 50]], 32));
  if (r.debtToEquity != null) parts.push(band(-r.debtToEquity, [[-0.4, 88], [-0.9, 68], [-1.8, 46]], 24));
  return parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : undefined;
}

function growthScore(r: ScreenerRow): number | undefined {
  const parts: number[] = [];
  if (r.revGrowth != null) parts.push(band(r.revGrowth, [[18, 88], [10, 72], [4, 56], [0, 44]], 22));
  if (r.epsGrowth != null) parts.push(band(r.epsGrowth, [[20, 88], [10, 72], [0, 54]], 24));
  return parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : undefined;
}

function momentumScore(r: ScreenerRow): number | undefined {
  const parts: number[] = [];
  if (r.vs200dma != null) parts.push(Math.max(8, Math.min(92, 50 + r.vs200dma * 1.6)));
  if (r.from52wHigh != null) parts.push(Math.max(10, Math.min(90, 90 + r.from52wHigh * 1.2)));
  return parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : undefined;
}

function buildRow(symbol: string, q: StockQuote | undefined, f: FundamentalsData | null): ScreenerRow {
  const price = q?.last ?? f?.fiftyDayAverage;
  const pe = f?.trailingPE;
  const epsGrowthPct = f?.earningsGrowth != null ? f.earningsGrowth * 100 : undefined;
  const peg = pe != null && pe > 0 && epsGrowthPct != null && epsGrowthPct > 0 ? pe / epsGrowthPct : undefined;
  const from52wHigh =
    price != null && f?.fiftyTwoWeekHigh ? ((price - f.fiftyTwoWeekHigh) / f.fiftyTwoWeekHigh) * 100 : undefined;
  const vs200dma =
    price != null && f?.twoHundredDayAverage
      ? ((price - f.twoHundredDayAverage) / f.twoHundredDayAverage) * 100
      : undefined;

  const row: ScreenerRow = {
    symbol,
    name: q?.name ?? f?.name ?? symbol,
    sector: f?.sector,
    price,
    changePct: q?.changePercent,
    marketCap: q?.marketCap ?? f?.marketCap,
    pe,
    fwdPe: f?.forwardPE,
    pb: f?.priceToBook,
    peg: peg != null ? Math.round(peg * 100) / 100 : undefined,
    divYield: f?.dividendYield != null ? f.dividendYield * 100 : undefined,
    roe: f?.returnOnEquity != null ? f.returnOnEquity * 100 : undefined,
    netMargin: f?.profitMargin != null ? f.profitMargin * 100 : undefined,
    opMargin: f?.operatingMargin != null ? f.operatingMargin * 100 : undefined,
    revGrowth: f?.revenueGrowth != null ? f.revenueGrowth * 100 : undefined,
    epsGrowth: epsGrowthPct,
    debtToEquity: f?.debtToEquity != null ? f.debtToEquity / 100 : undefined, // Yahoo reports %
    from52wHigh: from52wHigh != null ? Math.round(from52wHigh * 10) / 10 : undefined,
    vs200dma: vs200dma != null ? Math.round(vs200dma * 10) / 10 : undefined,
    beta: f?.beta ?? undefined,
  };

  row.valueScore = valueScore(row);
  row.qualityScore = qualityScore(row);
  row.growthScore = growthScore(row);
  row.momentumScore = momentumScore(row);
  const subs = [row.valueScore, row.qualityScore, row.growthScore, row.momentumScore].filter(
    (x): x is number => x != null
  );
  row.composite = subs.length ? Math.round(subs.reduce((a, b) => a + b, 0) / subs.length) : undefined;
  return row;
}

async function assemble(): Promise<ScreenerPayload> {
  const symbols = universeSymbols();

  // Live quotes in chunks (bulk endpoint caps at 60); tolerate partial failure.
  const quoteMap = new Map<string, StockQuote>();
  for (let i = 0; i < symbols.length; i += 50) {
    const chunk = symbols.slice(i, i + 50);
    try {
      const qs = await getQuotes(chunk);
      for (const q of qs) quoteMap.set(q.symbol.toUpperCase(), q);
    } catch {
      /* chunk failed · those names fall back to fundamentals price */
    }
  }

  const funds = await mapPool(symbols, 12, async (s) => {
    try {
      return await getFundamentals(s);
    } catch {
      return null;
    }
  });

  const rows = symbols.map((s, i) => buildRow(s, quoteMap.get(s.toUpperCase()), funds[i]));
  const covered = rows.filter((r) => r.pe != null || r.roe != null || r.revGrowth != null).length;
  const sectors = [...new Set(rows.map((r) => r.sector).filter((x): x is string => !!x))].sort();

  return { rows, universe: symbols.length, covered, sectors, generatedAt: Date.now() };
}

export function getScreener(): Promise<ScreenerPayload> {
  return cached("screener:v1", 30 * 60 * 1000, assemble);
}

export interface SectorMedians {
  pe?: number;
  pb?: number;
  roe?: number;
  revGrowth?: number;
  netMargin?: number;
  count: number;
}

function med(xs: Array<number | undefined>): number | undefined {
  const s = xs.filter((x): x is number => x != null && Number.isFinite(x)).sort((a, b) => a - b);
  if (!s.length) return undefined;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Per-sector median metrics, used to score valuation/quality relative to peers. */
export async function getSectorMedians(): Promise<Record<string, SectorMedians>> {
  const { rows } = await getScreener();
  const bySector = new Map<string, ScreenerRow[]>();
  for (const r of rows) {
    if (!r.sector) continue;
    const list = bySector.get(r.sector) ?? [];
    list.push(r);
    bySector.set(r.sector, list);
  }
  const out: Record<string, SectorMedians> = {};
  for (const [sector, list] of bySector) {
    out[sector] = {
      pe: med(list.map((r) => (r.pe != null && r.pe > 0 ? r.pe : undefined))),
      pb: med(list.map((r) => r.pb)),
      roe: med(list.map((r) => r.roe)),
      revGrowth: med(list.map((r) => r.revGrowth)),
      netMargin: med(list.map((r) => r.netMargin)),
      count: list.length,
    };
  }
  return out;
}
