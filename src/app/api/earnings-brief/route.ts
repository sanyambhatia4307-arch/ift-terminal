import { handle } from "@/lib/api-route";
import { generateEarningsBrief, type EarningsBriefSummary } from "@/lib/analysis/llm";
import { cached } from "@/lib/cache";
import { getFundamentals, getNews } from "@/lib/market";
import type { NewsItem } from "@/types/market";

export const dynamic = "force-dynamic";

export interface EarningsBrief {
  symbol: string;
  company: string;
  resultNews: NewsItem[];
  commentaryNews: NewsItem[];
  summary: EarningsBriefSummary | null;
  generatedAt: number;
}

export function GET(req: Request) {
  return handle(async () => {
    const sp = new URL(req.url).searchParams;
    const symbol = (sp.get("symbol") ?? "").trim().toUpperCase();
    if (!symbol) throw new Error("symbol required");

    return cached(`earnings-brief:${symbol}`, 30 * 60 * 1000, async () => {
      let company = symbol;
      try {
        company = (await getFundamentals(symbol)).name ?? symbol;
      } catch {
        // index/ETF · keep symbol
      }
      const [resultNews, commentaryNews] = await Promise.all([
        getNews(`${company} quarterly results revenue profit`)
          .then((n) => n.slice(0, 6))
          .catch(() => [] as NewsItem[]),
        getNews(`${company} CEO management guidance outlook earnings call`)
          .then((n) => n.slice(0, 6))
          .catch(() => [] as NewsItem[]),
      ]);
      const summary = await generateEarningsBrief(
        company,
        resultNews.map((n) => n.title),
        commentaryNews.map((n) => n.title)
      );
      return {
        symbol,
        company,
        resultNews,
        commentaryNews,
        summary,
        generatedAt: Date.now(),
      } satisfies EarningsBrief;
    });
  });
}
