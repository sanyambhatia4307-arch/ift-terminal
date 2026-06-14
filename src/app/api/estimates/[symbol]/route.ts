import { handle } from "@/lib/api-route";
import { getEstimates } from "@/lib/market";

export const dynamic = "force-dynamic";

/** Forward EPS estimates + analyst revision momentum. */
export function GET(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  return handle(async () => {
    const { symbol } = await params;
    return getEstimates(decodeURIComponent(symbol).toUpperCase());
  });
}
