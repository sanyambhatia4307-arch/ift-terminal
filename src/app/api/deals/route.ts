import { handle } from "@/lib/api-route";
import { cached } from "@/lib/cache";
import { nseLargeDeals } from "@/lib/sources/nse";

export const dynamic = "force-dynamic";

export function GET() {
  return handle(() => cached("large-deals", 5 * 60 * 1000, nseLargeDeals));
}
