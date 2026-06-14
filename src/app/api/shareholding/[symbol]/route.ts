import { handle } from "@/lib/api-route";
import { getShareholding } from "@/lib/market";

export const dynamic = "force-dynamic";

/** Quarterly promoter / public holding trend (NSE filings). */
export function GET(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  return handle(async () => {
    const { symbol } = await params;
    return getShareholding(decodeURIComponent(symbol).toUpperCase());
  });
}
