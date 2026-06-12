import { handle } from "@/lib/api-route";
import { buildForecast } from "@/lib/analysis/forecast";
import { cached } from "@/lib/cache";

export const dynamic = "force-dynamic";

export function GET(
  req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  return handle(async () => {
    const symbol = decodeURIComponent((await params).symbol);
    const horizon = Math.min(
      60,
      Math.max(5, parseInt(new URL(req.url).searchParams.get("horizon") ?? "30"))
    );
    return cached(`forecast:${symbol}:${horizon}`, 10 * 60 * 1000, () =>
      buildForecast(symbol, horizon)
    );
  });
}
