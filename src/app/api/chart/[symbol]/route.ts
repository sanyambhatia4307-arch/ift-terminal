import { handle } from "@/lib/api-route";
import { getChart } from "@/lib/market";

export const dynamic = "force-dynamic";

const ALLOWED_RANGES = new Set(["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "max"]);
const ALLOWED_INTERVALS = new Set(["1m", "5m", "15m", "30m", "1h", "1d", "1wk", "1mo"]);

export function GET(
  req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  return handle(async () => {
    const sp = new URL(req.url).searchParams;
    const range = sp.get("range") ?? "1y";
    const interval = sp.get("interval") ?? "1d";
    if (!ALLOWED_RANGES.has(range) || !ALLOWED_INTERVALS.has(interval)) {
      throw new Error("Invalid range or interval");
    }
    return getChart(decodeURIComponent((await params).symbol), range, interval);
  });
}
