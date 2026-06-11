import { handle } from "@/lib/api-route";
import { searchSymbols } from "@/lib/market";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return handle(async () => {
    const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
    if (q.length < 2) return [];
    return searchSymbols(q);
  });
}
