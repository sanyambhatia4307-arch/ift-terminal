import YahooFinance from "yahoo-finance2";
import type {
  ChartResult,
  FundamentalsData,
  SearchResult,
  StockQuote,
} from "@/types/market";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" };

/** Map an app symbol (NSE code like RELIANCE, or index key) to a Yahoo symbol. */
export function toYahooSymbol(symbol: string): string {
  const s = symbol.toUpperCase();
  // Already-Yahoo forms: indices (^), suffixed (.NS/.BO), futures (=F),
  // FX (=X) and crypto pairs (-USD) pass through untouched.
  if (s.startsWith("^") || s.includes(".") || s.includes("=") || s.endsWith("-USD")) return s;
  const indexMap: Record<string, string> = {
    "NIFTY 50": "^NSEI",
    "NIFTY BANK": "^NSEBANK",
    "NIFTY NEXT 50": "^NSMIDCP",
    "NIFTY 100": "^CNX100",
    "NIFTY 200": "^CNX200",
    "NIFTY 500": "^CRSLDX",
    "NIFTY MIDCAP 100": "NIFTY_MIDCAP_100.NS",
    "NIFTY SMLCAP 100": "^CNXSC",
    "NIFTY IT": "^CNXIT",
    "NIFTY FIN SERVICE": "NIFTY_FIN_SERVICE.NS",
    "NIFTY AUTO": "^CNXAUTO",
    "NIFTY PHARMA": "^CNXPHARMA",
    "NIFTY FMCG": "^CNXFMCG",
    "NIFTY METAL": "^CNXMETAL",
    "NIFTY REALTY": "^CNXREALTY",
    "NIFTY ENERGY": "^CNXENERGY",
    "NIFTY PSU BANK": "^CNXPSUBANK",
    "NIFTY MEDIA": "^CNXMEDIA",
    "NIFTY MIDCAP SELECT": "NIFTY_MID_SELECT.NS",
    "INDIA VIX": "^INDIAVIX",
    SENSEX: "^BSESN",
  };
  return indexMap[s] ?? `${s}.NS`;
}

interface YChart {
  chart: {
    result: Array<{
      meta: {
        currency: string;
        symbol: string;
        regularMarketPrice: number;
        chartPreviousClose?: number;
        previousClose?: number;
        regularMarketTime?: number;
        longName?: string;
        shortName?: string;
        exchangeName?: string;
        fullExchangeName?: string;
        fiftyTwoWeekHigh?: number;
        fiftyTwoWeekLow?: number;
        regularMarketDayHigh?: number;
        regularMarketDayLow?: number;
        regularMarketVolume?: number;
      };
      timestamp?: number[];
      indicators: {
        quote: Array<{
          open: (number | null)[];
          high: (number | null)[];
          low: (number | null)[];
          close: (number | null)[];
          volume: (number | null)[];
        }>;
      };
    }>;
    error: unknown;
  };
}

async function fetchChart(
  symbol: string,
  range: string,
  interval: string
): Promise<YChart["chart"]["result"][0]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?range=${range}&interval=${interval}&includePrePost=false`;
  const res = await fetch(url, {
    headers: UA,
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Yahoo chart ${symbol} -> ${res.status}`);
  const json = (await res.json()) as YChart;
  const result = json.chart?.result?.[0];
  if (!result) throw new Error(`Yahoo chart ${symbol} -> empty result`);
  return result;
}

export async function yahooChart(
  symbol: string,
  range = "1y",
  interval = "1d"
): Promise<ChartResult> {
  const ySym = toYahooSymbol(symbol);
  const result = await fetchChart(ySym, range, interval);
  const ts = result.timestamp ?? [];
  const q = result.indicators.quote[0];
  const candles = ts
    .map((time, i) => ({
      time,
      open: q.open[i],
      high: q.high[i],
      low: q.low[i],
      close: q.close[i],
      volume: q.volume[i] ?? undefined,
    }))
    .filter(
      (c): c is NonNullable<typeof c> & { open: number; high: number; low: number; close: number } =>
        c.open != null && c.high != null && c.low != null && c.close != null
    );
  return {
    symbol,
    currency: result.meta.currency,
    range,
    interval,
    previousClose: result.meta.chartPreviousClose ?? result.meta.previousClose,
    candles,
  };
}

/** Quote built from the chart meta — works without crumb auth. */
export async function yahooQuoteLite(symbol: string): Promise<StockQuote> {
  const ySym = toYahooSymbol(symbol);
  const result = await fetchChart(ySym, "1d", "5m");
  const m = result.meta;
  const prev = m.chartPreviousClose ?? m.previousClose ?? m.regularMarketPrice;
  return {
    symbol,
    name: m.longName ?? m.shortName ?? symbol,
    exchange: m.fullExchangeName ?? m.exchangeName,
    currency: m.currency,
    last: m.regularMarketPrice,
    change: m.regularMarketPrice - prev,
    changePercent: prev ? ((m.regularMarketPrice - prev) / prev) * 100 : 0,
    previousClose: prev,
    high: m.regularMarketDayHigh,
    low: m.regularMarketDayLow,
    volume: m.regularMarketVolume,
    yearHigh: m.fiftyTwoWeekHigh,
    yearLow: m.fiftyTwoWeekLow,
    asOf: m.regularMarketTime,
  };
}

export async function yahooQuotes(symbols: string[]): Promise<StockQuote[]> {
  const settled = await Promise.allSettled(symbols.map((s) => yahooQuoteLite(s)));
  return settled
    .filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === "fulfilled")
    .map((r) => r.value);
}

export async function yahooSearch(q: string): Promise<SearchResult[]> {
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
    q
  )}&quotesCount=12&newsCount=0`;
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(8_000) });
  if (!res.ok) throw new Error(`Yahoo search -> ${res.status}`);
  const json = (await res.json()) as {
    quotes: Array<{
      symbol: string;
      shortname?: string;
      longname?: string;
      exchange: string;
      quoteType: string;
      exchDisp?: string;
    }>;
  };
  const results = json.quotes
    .filter((r) => r.quoteType === "EQUITY" || r.quoteType === "INDEX")
    .map((r) => ({
      symbol: r.symbol,
      name: r.longname ?? r.shortname ?? r.symbol,
      exchange: r.exchDisp ?? r.exchange,
      type: r.quoteType,
    }));
  // Indian listings first — this is an Indian markets terminal.
  return results.sort((a, b) => {
    const ai = a.symbol.endsWith(".NS") || a.symbol.endsWith(".BO") ? 0 : 1;
    const bi = b.symbol.endsWith(".NS") || b.symbol.endsWith(".BO") ? 0 : 1;
    return ai - bi;
  });
}

/** Next earnings window for a symbol (start/end can differ until confirmed). */
export async function yahooEarningsDates(
  symbol: string
): Promise<{ start?: Date; end?: Date } | null> {
  const ySym = toYahooSymbol(symbol);
  const r = await yf.quoteSummary(ySym, { modules: ["calendarEvents"] });
  const dates = r.calendarEvents?.earnings?.earningsDate;
  if (!dates || dates.length === 0) return null;
  return { start: dates[0], end: dates[dates.length - 1] };
}

export async function yahooFundamentals(symbol: string): Promise<FundamentalsData> {
  const ySym = toYahooSymbol(symbol);
  const r = await yf.quoteSummary(ySym, {
    modules: [
      "summaryProfile",
      "summaryDetail",
      "defaultKeyStatistics",
      "financialData",
      "price",
      "earnings",
    ],
  });
  const sd = r.summaryDetail;
  const ks = r.defaultKeyStatistics;
  const fd = r.financialData;
  const sp = r.summaryProfile;
  const price = r.price;
  return {
    symbol,
    name: price?.longName ?? price?.shortName ?? undefined,
    sector: sp?.sector,
    industry: sp?.industry,
    summary: sp?.longBusinessSummary,
    website: sp?.website,
    marketCap: price?.marketCap ?? sd?.marketCap,
    trailingPE: sd?.trailingPE,
    forwardPE: sd?.forwardPE ?? ks?.forwardPE,
    priceToBook: ks?.priceToBook,
    eps: ks?.trailingEps,
    beta: sd?.beta ?? ks?.beta,
    dividendYield: sd?.dividendYield,
    bookValue: ks?.bookValue,
    totalRevenue: fd?.totalRevenue,
    netIncome: ks?.netIncomeToCommon,
    profitMargin: fd?.profitMargins,
    operatingMargin: fd?.operatingMargins,
    returnOnEquity: fd?.returnOnEquity,
    debtToEquity: fd?.debtToEquity,
    revenueGrowth: fd?.revenueGrowth,
    earningsGrowth: fd?.earningsGrowth,
    totalCash: fd?.totalCash,
    totalDebt: fd?.totalDebt,
    fiftyTwoWeekHigh: sd?.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: sd?.fiftyTwoWeekLow,
    fiftyDayAverage: sd?.fiftyDayAverage,
    twoHundredDayAverage: sd?.twoHundredDayAverage,
    sharesOutstanding: ks?.sharesOutstanding,
    heldByInsiders: ks?.heldPercentInsiders,
    heldByInstitutions: ks?.heldPercentInstitutions,
    targetMeanPrice: fd?.targetMeanPrice,
    recommendationKey: fd?.recommendationKey,
    numberOfAnalysts: fd?.numberOfAnalystOpinions,
    quarterlyResults: r.earnings?.financialsChart?.quarterly?.map((q) => ({
      period: String(q.date),
      revenue: q.revenue ?? undefined,
      earnings: q.earnings ?? undefined,
    })),
    yearlyResults: r.earnings?.financialsChart?.yearly?.map((y) => ({
      period: String(y.date),
      revenue: typeof y.revenue === "number" ? y.revenue : undefined,
      earnings: typeof y.earnings === "number" ? y.earnings : undefined,
    })),
  };
}
