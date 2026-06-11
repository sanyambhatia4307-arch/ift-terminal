import { handle } from "@/lib/api-route";
import { getMovers } from "@/lib/market";

export const dynamic = "force-dynamic";

export function GET() {
  return handle(() => getMovers());
}
