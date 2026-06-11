import { handle } from "@/lib/api-route";
import { getQuotes } from "@/lib/market";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return handle(async () => {
    const symbols = (new URL(req.url).searchParams.get("symbols") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 60);
    if (symbols.length === 0) return [];
    return getQuotes(symbols);
  });
}
