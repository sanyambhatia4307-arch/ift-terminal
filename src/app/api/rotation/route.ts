import { handle } from "@/lib/api-route";
import { getRotation } from "@/lib/analysis/rotation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Sector relative-strength / rotation snapshot vs the NIFTY 50. */
export function GET() {
  return handle(() => getRotation());
}
