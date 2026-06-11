import { handle } from "@/lib/api-route";
import { getIndices } from "@/lib/market";

export const dynamic = "force-dynamic";

export function GET() {
  return handle(() => getIndices());
}
