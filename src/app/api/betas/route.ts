import { handle } from "@/lib/api-route";
import { getBetas } from "@/lib/analysis/risk";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Beta vs NIFTY 50 for a set of symbols · `?symbols=A,B,C`. */
export function GET(req: Request) {
  return handle(async () => {
    const symbols = (new URL(req.url).searchParams.get("symbols") ?? "")
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 40);
    if (symbols.length === 0) return {};
    return getBetas(symbols);
  });
}
