import { handle } from "@/lib/api-route";
import { getFundamentals } from "@/lib/market";

export const dynamic = "force-dynamic";

export function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  return handle(async () =>
    getFundamentals(decodeURIComponent((await params).symbol))
  );
}
