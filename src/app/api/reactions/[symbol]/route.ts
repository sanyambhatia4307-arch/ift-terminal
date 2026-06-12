import { handle } from "@/lib/api-route";
import { buildReactions } from "@/lib/analysis/reactions";
import { cached } from "@/lib/cache";

export const dynamic = "force-dynamic";

export function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  return handle(async () => {
    const symbol = decodeURIComponent((await params).symbol).toUpperCase();
    return cached(`reactions:${symbol}`, 12 * 60 * 60 * 1000, () =>
      buildReactions(symbol)
    );
  });
}
