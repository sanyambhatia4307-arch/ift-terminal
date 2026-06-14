import type {
  IndexQuote,
  MarketStatusInfo,
  Mover,
  OptionChainData,
  OptionStrikeRow,
  ShareholdingData,
  ShareholdingQuarter,
} from "@/types/market";

/**
 * NSE's public JSON API sits behind Akamai. Some endpoints respond bare;
 * others need cookies acquired from a landing page. We keep one short-lived
 * session per server process and retry once with a fresh session on 401/403.
 */

const BASE = "https://www.nseindia.com";
const SESSION_TTL_MS = 4 * 60 * 1000;

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.nseindia.com/",
};

let session: { cookie: string; fetchedAt: number } | null = null;

async function getCookie(force = false): Promise<string> {
  if (!force && session && Date.now() - session.fetchedAt < SESSION_TTL_MS) {
    return session.cookie;
  }
  const res = await fetch(`${BASE}/market-data/live-equity-market`, {
    headers: { ...BROWSER_HEADERS, Accept: "text/html,application/xhtml+xml" },
    cache: "no-store",
  });
  const cookie = res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  session = { cookie, fetchedAt: Date.now() };
  return cookie;
}

async function nseJson<T>(path: string): Promise<T> {
  // First try bare · several endpoints (allIndices, marketStatus) allow it.
  const attempt = async (cookie?: string) => {
    const res = await fetch(`${BASE}${path}`, {
      headers: {
        ...BROWSER_HEADERS,
        Accept: "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`NSE ${path} -> ${res.status}`);
    const text = await res.text();
    if (text.trimStart().startsWith("<")) throw new Error(`NSE ${path} -> HTML block page`);
    return JSON.parse(text) as T;
  };

  try {
    return await attempt(session?.cookie);
  } catch {
    return attempt(await getCookie(true));
  }
}

interface NseIndexRow {
  key: string;
  index: string;
  indexSymbol: string;
  last: number;
  variation: number;
  percentChange: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  yearHigh: number;
  yearLow: number;
  pe: string;
  pb: string;
  dy: string;
  advances?: string;
  declines?: string;
  unchanged?: string;
}

function toIndexQuote(row: NseIndexRow): IndexQuote {
  return {
    symbol: row.indexSymbol,
    name: row.index,
    last: row.last,
    change: row.variation,
    changePercent: row.percentChange,
    open: row.open,
    high: row.high,
    low: row.low,
    previousClose: row.previousClose,
    yearHigh: row.yearHigh,
    yearLow: row.yearLow,
    pe: parseFloat(row.pe) || undefined,
    pb: parseFloat(row.pb) || undefined,
    divYield: parseFloat(row.dy) || undefined,
    advances: row.advances ? parseInt(row.advances) : undefined,
    declines: row.declines ? parseInt(row.declines) : undefined,
    unchanged: row.unchanged ? parseInt(row.unchanged) : undefined,
    category: row.key,
  };
}

export async function nseAllIndices(): Promise<IndexQuote[]> {
  const data = await nseJson<{ data: NseIndexRow[] }>("/api/allIndices");
  return data.data.map(toIndexQuote);
}

interface NseMarketState {
  market: string;
  marketStatus: string;
  tradeDate: string;
  index: string;
  last: number | string;
  percentChange: number | string;
  marketStatusMessage: string;
}

export async function nseMarketStatus(): Promise<MarketStatusInfo> {
  const data = await nseJson<{ marketState: NseMarketState[] }>("/api/marketStatus");
  const cm =
    data.marketState.find((m) => m.market === "Capital Market") ?? data.marketState[0];
  return {
    market: cm.market,
    status: cm.marketStatus,
    message: cm.marketStatusMessage,
    tradeDate: cm.tradeDate,
    isOpen: cm.marketStatus.toLowerCase() === "open",
    indexLast: typeof cm.last === "number" ? cm.last : undefined,
    indexChangePercent:
      typeof cm.percentChange === "number" ? cm.percentChange : undefined,
  };
}

export interface FiiDiiFlow {
  category: string; // "FII/FPI" | "DII"
  date: string;
  buyValue: number;
  sellValue: number;
  netValue: number; // ₹ crore
}

export async function nseFiiDii(): Promise<FiiDiiFlow[]> {
  const rows = await nseJson<
    Array<{ category: string; date: string; buyValue: string; sellValue: string; netValue: string }>
  >("/api/fiidiiTradeReact");
  return rows.map((r) => ({
    category: r.category,
    date: r.date,
    buyValue: parseFloat(r.buyValue),
    sellValue: parseFloat(r.sellValue),
    netValue: parseFloat(r.netValue),
  }));
}

export interface LargeDeal {
  type: "BULK" | "BLOCK" | "SHORT";
  symbol: string;
  name: string;
  clientName: string;
  buySell: "BUY" | "SELL";
  qty: number;
  price: number; // weighted avg trade price
  date: string;
}

interface NseDealRow {
  buySell: string;
  clientName: string;
  date: string;
  name: string;
  qty: string;
  symbol: string;
  watp: string;
}

export async function nseLargeDeals(): Promise<{ asOn: string; deals: LargeDeal[] }> {
  const data = await nseJson<{
    as_on_date: string;
    BULK_DEALS_DATA?: NseDealRow[];
    BLOCK_DEALS_DATA?: NseDealRow[];
    SHORT_DEALS_DATA?: NseDealRow[];
  }>("/api/snapshot-capital-market-largedeal");

  const map = (rows: NseDealRow[] | undefined, type: LargeDeal["type"]): LargeDeal[] =>
    (rows ?? []).map((r) => ({
      type,
      symbol: r.symbol,
      name: r.name,
      clientName: r.clientName,
      buySell: r.buySell === "BUY" ? "BUY" : "SELL",
      qty: parseInt(r.qty) || 0,
      price: parseFloat(r.watp) || 0,
      date: r.date,
    }));

  return {
    asOn: data.as_on_date,
    deals: [
      ...map(data.BLOCK_DEALS_DATA, "BLOCK"),
      ...map(data.BULK_DEALS_DATA, "BULK"),
    ].sort((a, b) => b.qty * b.price - a.qty * a.price),
  };
}

/* ---- Options / OI (index derivatives) ---- */

interface OcLeg {
  openInterest?: number;
  changeinOpenInterest?: number;
  impliedVolatility?: number;
}
interface OcRow {
  strikePrice: number;
  CE?: OcLeg;
  PE?: OcLeg;
}

/** Option-chain snapshot for an index derivative (NIFTY/BANKNIFTY/FINNIFTY/MIDCPNIFTY). */
export async function nseOptionChain(symbol: string): Promise<OptionChainData> {
  const sym = symbol.toUpperCase();
  const ci = await nseJson<{ expiryDates?: string[] }>(
    `/api/option-chain-contract-info?symbol=${encodeURIComponent(sym)}`
  );
  const expiry = ci.expiryDates?.[0];
  if (!expiry) throw new Error(`No option expiry for ${sym}`);

  const oc = await nseJson<{
    records?: { data?: OcRow[]; underlyingValue?: number };
    filtered?: { CE?: { totOI?: number }; PE?: { totOI?: number } };
  }>(`/api/option-chain-v3?type=Indices&symbol=${encodeURIComponent(sym)}&expiry=${encodeURIComponent(expiry)}`);

  const data = oc.records?.data ?? [];
  const underlying = oc.records?.underlyingValue;
  const all: OptionStrikeRow[] = data
    .filter((d) => d.CE || d.PE)
    .map((d) => ({
      strike: d.strikePrice,
      ceOI: d.CE?.openInterest,
      ceChg: d.CE?.changeinOpenInterest,
      peOI: d.PE?.openInterest,
      peChg: d.PE?.changeinOpenInterest,
      ceIV: d.CE?.impliedVolatility || undefined,
      peIV: d.PE?.impliedVolatility || undefined,
    }));

  const totalCallOI = oc.filtered?.CE?.totOI ?? all.reduce((a, r) => a + (r.ceOI ?? 0), 0);
  const totalPutOI = oc.filtered?.PE?.totOI ?? all.reduce((a, r) => a + (r.peOI ?? 0), 0);
  const pcr = totalCallOI > 0 ? Math.round((totalPutOI / totalCallOI) * 100) / 100 : undefined;

  const maxBy = (sel: (r: OptionStrikeRow) => number) =>
    all.length ? all.reduce((m, r) => (sel(r) > sel(m) ? r : m), all[0]).strike : undefined;
  const resistance = maxBy((r) => r.ceOI ?? 0); // call writers defend above
  const support = maxBy((r) => r.peOI ?? 0); // put writers defend below

  // Max pain: strike that minimises total option-writer payout at expiry.
  let maxPain: number | undefined;
  let best = Infinity;
  for (const cand of all) {
    const P = cand.strike;
    let loss = 0;
    for (const r of all) {
      loss += (r.ceOI ?? 0) * Math.max(0, P - r.strike) + (r.peOI ?? 0) * Math.max(0, r.strike - P);
    }
    if (loss < best) {
      best = loss;
      maxPain = P;
    }
  }

  // Keep the ~14 strikes nearest the money for the table.
  const rows = underlying
    ? [...all]
        .sort((a, b) => Math.abs(a.strike - underlying) - Math.abs(b.strike - underlying))
        .slice(0, 14)
        .sort((a, b) => a.strike - b.strike)
    : all;

  return { symbol: sym, underlying, expiry, pcr, maxPain, support, resistance, totalCallOI, totalPutOI, rows };
}

/* ---- Shareholding pattern (promoter trend) ---- */

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};
function parseNseDate(d: string): number {
  const [dd, mon, yyyy] = d.split("-");
  return new Date(Number(yyyy), MONTHS[mon] ?? 0, Number(dd)).getTime();
}

/** Quarterly promoter / public holding trend from NSE corporate filings. */
export async function nseShareholding(symbol: string): Promise<ShareholdingData> {
  const r = await nseJson<{
    shareholdings_patterns?: { data?: Record<string, Array<Record<string, string>>> };
  }>(`/api/top-corp-info?symbol=${encodeURIComponent(symbol.toUpperCase())}&market=equities`);

  const data = r.shareholdings_patterns?.data ?? {};
  const val = (arr: Array<Record<string, string>>, key: string) => {
    const o = arr.find((x) => key in x);
    const n = o ? parseFloat(o[key]) : NaN;
    return Number.isFinite(n) ? n : undefined;
  };
  const quarters: ShareholdingQuarter[] = Object.entries(data)
    .map(([date, arr]) => ({
      date,
      promoter: val(arr, "Promoter & Promoter Group"),
      publicHolding: val(arr, "Public"),
    }))
    .sort((a, b) => parseNseDate(a.date) - parseNseDate(b.date));

  const withProm = quarters.filter((q) => q.promoter != null);
  const promoterLatest = withProm.length ? withProm[withProm.length - 1].promoter : undefined;
  const promoterChange =
    withProm.length >= 2 ? (withProm[withProm.length - 1].promoter! - withProm[0].promoter!) : undefined;
  const trend: ShareholdingData["trend"] =
    promoterChange == null ? "stable" : promoterChange > 0.3 ? "rising" : promoterChange < -0.3 ? "falling" : "stable";

  return { symbol: symbol.toUpperCase(), quarters, promoterLatest, promoterChange, trend };
}

/** Historical board-meeting dates for financial results (newest first). */
export async function nseResultsDates(symbol: string, limit = 9): Promise<Date[]> {
  const rows = await nseJson<
    Array<{ symbol: string; purpose: string; date: string }>
  >(`/api/event-calendar?index=equities&symbol=${encodeURIComponent(symbol)}`);
  const seen = new Set<string>(); // NSE sometimes lists duplicate entries per date
  return rows
    .filter((r) => /financial results|results/i.test(r.purpose))
    .filter((r) => (seen.has(r.date) ? false : (seen.add(r.date), true)))
    .map((r) => new Date(`${r.date} 12:00:00 GMT+0530`))
    .filter((d) => !Number.isNaN(d.getTime()) && d.getTime() < Date.now())
    .sort((a, b) => b.getTime() - a.getTime())
    .slice(0, limit);
}

interface NseStockRow {
  symbol: string;
  lastPrice: number;
  change: number;
  pChange: number;
  totalTradedVolume?: number;
  meta?: { companyName?: string };
  priority?: number;
}

export interface NseConstituents {
  stocks: Mover[];
  advances?: number;
  declines?: number;
  unchanged?: number;
}

/** Constituent-level data for an index · needs the cookie session. */
export async function nseIndexConstituents(index: string): Promise<NseConstituents> {
  const data = await nseJson<{
    data: NseStockRow[];
    advance?: { advances: string; declines: string; unchanged: string };
  }>(`/api/equity-stockIndices?index=${encodeURIComponent(index)}`);

  const stocks = data.data
    .filter((r) => r.priority !== 1 && r.symbol !== index)
    .map((r) => ({
      symbol: r.symbol,
      name: r.meta?.companyName,
      last: r.lastPrice,
      change: r.change,
      changePercent: r.pChange,
      volume: r.totalTradedVolume,
    }));

  return {
    stocks,
    advances: data.advance ? parseInt(data.advance.advances) : undefined,
    declines: data.advance ? parseInt(data.advance.declines) : undefined,
    unchanged: data.advance ? parseInt(data.advance.unchanged) : undefined,
  };
}
