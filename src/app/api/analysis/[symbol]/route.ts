import { handle } from "@/lib/api-route";
import { buildAnalysis } from "@/lib/analysis/engine";
import { cached } from "@/lib/cache";

export const dynamic = "force-dynamic";

export function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  return handle(async () => {
    const symbol = decodeURIComponent((await params).symbol);
    return cached(`analysis:${symbol}`, 10 * 60 * 1000, () =>
      buildAnalysis(symbol)
    );
  });
}
