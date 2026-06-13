import { handle } from "@/lib/api-route";
import { getScreener } from "@/lib/screener";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Full screener universe · filtered and ranked client-side. */
export function GET() {
  return handle(() => getScreener());
}
