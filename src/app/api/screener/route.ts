import { handle } from "@/lib/api-route";
import { getScreener } from "@/lib/screener";

export const dynamic = "force-dynamic";

/** Full screener universe · filtered and ranked client-side. */
export function GET() {
  return handle(() => getScreener());
}
