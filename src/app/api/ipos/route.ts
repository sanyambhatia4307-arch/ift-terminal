import { handle } from "@/lib/api-route";
import { cached } from "@/lib/cache";
import { IPO_DATA_AS_OF, IPO_PIPELINE } from "@/lib/data/ipos";
import { getNews } from "@/lib/market";
import type { NewsItem } from "@/types/market";

export const dynamic = "force-dynamic";

export function GET() {
  return handle(() =>
    cached("ipos", 10 * 60 * 1000, async () => {
      const news = await Promise.all(
        IPO_PIPELINE.map(async (ipo) => {
          try {
            return (await getNews(ipo.newsQuery)).slice(0, 4);
          } catch {
            return [] as NewsItem[];
          }
        })
      );
      return {
        asOf: IPO_DATA_AS_OF,
        ipos: IPO_PIPELINE.map((ipo, i) => ({ ...ipo, news: news[i] })),
      };
    })
  );
}
