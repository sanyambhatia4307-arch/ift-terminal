import { handle } from "@/lib/api-route";
import { getTopPicks } from "@/lib/analysis/top-picks";

export const dynamic = "force-dynamic";

export function GET() {
  return handle(() => getTopPicks());
}
