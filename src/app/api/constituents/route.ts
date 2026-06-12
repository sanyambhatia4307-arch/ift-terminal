import { handle } from "@/lib/api-route";
import { constituentsFor } from "@/lib/data/constituents";
import { getQuotes } from "@/lib/market";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return handle(async () => {
    const index = (new URL(req.url).searchParams.get("index") ?? "").trim();
    const symbols = constituentsFor(index);
    if (!symbols) return { index, supported: false, stocks: [] };
    const quotes = await getQuotes(symbols);
    const stocks = [...quotes].sort((a, b) => b.changePercent - a.changePercent);
    return { index, supported: true, stocks };
  });
}
