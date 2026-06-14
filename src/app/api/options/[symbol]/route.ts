import { handle } from "@/lib/api-route";
import { getOptionChain } from "@/lib/market";

export const dynamic = "force-dynamic";

/** Index option-chain snapshot · PCR, max pain, OI walls. */
export function GET(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  return handle(async () => {
    const { symbol } = await params;
    return getOptionChain(decodeURIComponent(symbol).toUpperCase());
  });
}
