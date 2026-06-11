import { handle } from "@/lib/api-route";
import { getQuote } from "@/lib/market";

export const dynamic = "force-dynamic";

export function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  return handle(async () => getQuote(decodeURIComponent((await params).symbol)));
}
