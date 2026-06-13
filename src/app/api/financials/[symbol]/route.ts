import { handle } from "@/lib/api-route";
import { getFinancials } from "@/lib/market";

export const dynamic = "force-dynamic";

/** Multi-year financial statements + derived ROCE / FCF / cash conversion. */
export function GET(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  return handle(async () => {
    const { symbol } = await params;
    return getFinancials(decodeURIComponent(symbol).toUpperCase());
  });
}
