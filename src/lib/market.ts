import { cached, firstOf } from "@/lib/cache";
import { NIFTY50 } from "@/lib/data/nifty50";
import { aggregatedNews } from "@/lib/sources/news";
import {
  nseAllIndices,
  nseIndexConstituents,
  nseMarketStatus,
} from "@/lib/sources/nse";
import {
  yahooChart,
  yahooFundamentals,
  yahooQuoteLite,
  yahooQuotes,
  yahooSearch,
} from "@/lib/sources/yahoo";
import type {
  ChartResult,
  FundamentalsData,
  IndexQuote,
  MarketStatusInfo,
  MoversResult,
  NewsItem,
  SearchResult,
  StockQuote,
} from "@/types/market";

/** Headline indices shown in the dashboard grid and ticker. */
const HEADLINE_INDICES = [
  "NIFTY 50",
  "NIFTY BANK",
  "NIFTY NEXT 50",
  "NIFTY MIDCAP 100",
  "NIFTY SMALLCAP 100",
  "NIFTY IT",
  "NIFTY FIN SERVICE",
  "INDIA VIX",
];

const SECTOR_INDICES = [
  "NIFTY BANK",
  "NIFTY IT",
  "NIFTY AUTO",
  "NIFTY PHARMA",
  "NIFTY FMCG",
  "NIFTY METAL",
  "NIFTY REALTY",
  "NIFTY ENERGY",
  "NIFTY FIN SERVICE",
  "NIFTY PSU BANK",
  "NIFTY MEDIA",
  "NIFTY PVT BANK",
];

export interface IndicesPayload {
  source: "nse" | "yahoo";
  asOf: number;
  headline: IndexQuote[];
  sectors: IndexQuote[];
  all: IndexQuote[];
}

async function indicesFromNse(): Promise<IndicesPayload> {
  const all = await nseAllIndices();
  const by = new Map(all.map((i) => [i.symbol, i]));
  const headline = HEADLINE_INDICES.map((s) => by.get(s)).filter(
    (i): i is IndexQuote => !!i
  );
  const sectors = SECTOR_INDICES.map((s) => by.get(s)).filter(
    (i): i is IndexQuote => !!i
  );
  return { source: "nse", asOf: Date.now(), headline, sectors, all };
}

async function indicesFromYahoo(): Promise<IndicesPayload> {
  const symbols: Array<[string, string]> = [
    ["^NSEI", "NIFTY 50"],
    ["^NSEBANK", "NIFTY BANK"],
    ["^BSESN", "SENSEX"],
    ["^CNXIT", "NIFTY IT"],
    ["^CNXAUTO", "NIFTY AUTO"],
    ["^CNXPHARMA", "NIFTY PHARMA"],
    ["^CNXFMCG", "NIFTY FMCG"],
    ["^CNXMETAL", "NIFTY METAL"],
  ];
  const quotes = await yahooQuotes(symbols.map(([s]) => s));
  const named = quotes.map((q) => {
    const name = symbols.find(([s]) => s === q.symbol)?.[1] ?? q.name;
    return {
      symbol: name,
      name,
      last: q.last,
      change: q.change,
      changePercent: q.changePercent,
      previousClose: q.previousClose,
      high: q.high,
      low: q.low,
      yearHigh: q.yearHigh,
      yearLow: q.yearLow,
    } satisfies IndexQuote;
  });
  if (named.length === 0) throw new Error("Yahoo indices empty");
  return {
    source: "yahoo",
    asOf: Date.now(),
    headline: named.slice(0, 3),
    sectors: named.slice(3),
    all: named,
  };
}

export function getIndices(): Promise<IndicesPayload> {
  return cached("indices", 30_000, () =>
    firstOf([indicesFromNse, indicesFromYahoo])
  );
}

export function getMarketStatus(): Promise<MarketStatusInfo> {
  return cached("market-status", 60_000, () =>
    firstOf([
      nseMarketStatus,
      async () => {
        // Fallback: infer from NSE trading hours (Mon–Fri 09:15–15:30 IST).
        const ist = new Date(
          new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
        );
        const mins = ist.getHours() * 60 + ist.getMinutes();
        const isWeekday = ist.getDay() >= 1 && ist.getDay() <= 5;
        const isOpen = isWeekday && mins >= 555 && mins <= 930;
        return {
          market: "Capital Market",
          status: isOpen ? "Open" : "Closed",
          message: isOpen ? "Normal market is open (inferred)" : "Market closed (inferred)",
          isOpen,
        } satisfies MarketStatusInfo;
      },
    ])
  );
}

async function moversFromNse(): Promise<MoversResult> {
  const { stocks, advances, declines, unchanged } = await nseIndexConstituents(
    "NIFTY 50"
  );
  const sorted = [...stocks].sort((a, b) => b.changePercent - a.changePercent);
  return {
    index: "NIFTY 50",
    source: "nse",
    gainers: sorted.slice(0, 8),
    losers: sorted.slice(-8).reverse(),
    advances,
    declines,
    unchanged,
  };
}

async function moversFromYahoo(): Promise<MoversResult> {
  const quotes = await yahooQuotes(NIFTY50.map((c) => c.symbol));
  const movers = quotes.map((q) => ({
    symbol: q.symbol,
    name: NIFTY50.find((c) => c.symbol === q.symbol)?.name ?? q.name,
    last: q.last,
    change: q.change,
    changePercent: q.changePercent,
    volume: q.volume,
  }));
  const sorted = movers.sort((a, b) => b.changePercent - a.changePercent);
  return {
    index: "NIFTY 50",
    source: "yahoo",
    gainers: sorted.slice(0, 8),
    losers: sorted.slice(-8).reverse(),
    advances: sorted.filter((m) => m.changePercent > 0).length,
    declines: sorted.filter((m) => m.changePercent < 0).length,
    unchanged: sorted.filter((m) => m.changePercent === 0).length,
  };
}

export function getMovers(): Promise<MoversResult> {
  return cached("movers:NIFTY 50", 60_000, () =>
    firstOf([moversFromNse, moversFromYahoo])
  );
}

export function getChart(
  symbol: string,
  range: string,
  interval: string
): Promise<ChartResult> {
  return cached(`chart:${symbol}:${range}:${interval}`, 60_000, () =>
    yahooChart(symbol, range, interval)
  );
}

export function getQuote(symbol: string): Promise<StockQuote> {
  return cached(`quote:${symbol}`, 20_000, () => yahooQuoteLite(symbol));
}

export function getQuotes(symbols: string[]): Promise<StockQuote[]> {
  const key = `quotes:${[...symbols].sort().join(",")}`;
  return cached(key, 30_000, () => yahooQuotes(symbols));
}

export function getFundamentals(symbol: string): Promise<FundamentalsData> {
  return cached(`fundamentals:${symbol}`, 6 * 60 * 60 * 1000, () =>
    yahooFundamentals(symbol)
  );
}

export function getNews(query?: string): Promise<NewsItem[]> {
  return cached(`news:${query ?? "_market"}`, 5 * 60 * 1000, () =>
    aggregatedNews(query)
  );
}

export function searchSymbols(q: string): Promise<SearchResult[]> {
  return cached(`search:${q.toLowerCase()}`, 10 * 60 * 1000, () => yahooSearch(q));
}
