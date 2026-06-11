import { handle } from "@/lib/api-route";
import { getNews } from "@/lib/market";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return handle(() => {
    const q = new URL(req.url).searchParams.get("q") ?? undefined;
    return getNews(q || undefined);
  });
}
