import { XMLParser } from "fast-xml-parser";
import type { NewsItem } from "@/types/market";

const parser = new XMLParser({ ignoreAttributes: false });

interface RssItem {
  title: string;
  link: string;
  pubDate?: string;
  source?: { "#text": string } | string;
}

async function fetchRss(url: string, fallbackSource: string): Promise<NewsItem[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`RSS ${url} -> ${res.status}`);
  const xml = await res.text();
  const doc = parser.parse(xml);
  const items: RssItem[] = doc?.rss?.channel?.item ?? [];
  return (Array.isArray(items) ? items : [items]).map((item) => {
    const source =
      typeof item.source === "object" ? item.source["#text"] : item.source ?? fallbackSource;
    return {
      id: `${source}:${item.link}`,
      title: String(item.title),
      link: String(item.link),
      source: String(source),
      publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
    };
  });
}

export function googleNewsRss(query: string): Promise<NewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
    query
  )}&hl=en-IN&gl=IN&ceid=IN:en`;
  return fetchRss(url, "Google News");
}

export function etMarketsRss(): Promise<NewsItem[]> {
  return fetchRss(
    "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
    "ET Markets"
  );
}

/** Aggregate, dedupe near-identical headlines, newest first. */
export async function aggregatedNews(query?: string): Promise<NewsItem[]> {
  const feeds = query
    ? [googleNewsRss(query)]
    : [googleNewsRss("indian stock market nifty sensex"), etMarketsRss()];

  const settled = await Promise.allSettled(feeds);
  const all = settled
    .filter((r): r is PromiseFulfilledResult<NewsItem[]> => r.status === "fulfilled")
    .flatMap((r) => r.value);

  if (all.length === 0) throw new Error("All news sources failed");

  const seen = new Set<string>();
  const deduped = all.filter((item) => {
    const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
