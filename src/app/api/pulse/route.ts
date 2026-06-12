import { handle } from "@/lib/api-route";
import { getMarketPulse } from "@/lib/analysis/pulse";

export const dynamic = "force-dynamic";

export function GET() {
  return handle(() => getMarketPulse());
}
