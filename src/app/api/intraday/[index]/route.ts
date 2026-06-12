import { handle } from "@/lib/api-route";
import { buildIntradayAnalysis } from "@/lib/analysis/intraday";
import { cached } from "@/lib/cache";

export const dynamic = "force-dynamic";

export function GET(
  _req: Request,
  { params }: { params: Promise<{ index: string }> }
) {
  return handle(async () => {
    const index = decodeURIComponent((await params).index);
    return cached(`intraday:${index.toUpperCase()}`, 60_000, () =>
      buildIntradayAnalysis(index)
    );
  });
}
