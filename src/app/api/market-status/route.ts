import { handle } from "@/lib/api-route";
import { getMarketStatus } from "@/lib/market";

export const dynamic = "force-dynamic";

export function GET() {
  return handle(() => getMarketStatus());
}
