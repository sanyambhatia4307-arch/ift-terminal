import { handle } from "@/lib/api-route";
import { cached } from "@/lib/cache";
import { NIFTY50 } from "@/lib/data/nifty50";
import { yahooEarningsDates } from "@/lib/sources/yahoo";

export const dynamic = "force-dynamic";

export interface EarningsEntry {
  symbol: string;
  name: string;
  sector: string;
  start: string; // ISO
  end?: string;
  confirmed: boolean; // single-date window = confirmed
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    })
  );
  return out;
}

export function GET() {
  return handle(() =>
    cached("earnings-calendar", 12 * 60 * 60 * 1000, async () => {
      const entries = await mapLimit(NIFTY50, 6, async (c): Promise<EarningsEntry | null> => {
        try {
          const window = await yahooEarningsDates(c.symbol);
          if (!window?.start) return null;
          return {
            symbol: c.symbol,
            name: c.name,
            sector: c.sector,
            start: window.start.toISOString(),
            end: window.end?.toISOString(),
            confirmed:
              !window.end || window.end.getTime() === window.start.getTime(),
          } satisfies EarningsEntry;
        } catch {
          return null;
        }
      });
      const now = Date.now() - 24 * 60 * 60 * 1000; // keep yesterday for context
      return entries
        .filter((e): e is EarningsEntry => e !== null)
        .filter((e) => new Date(e.start).getTime() > now)
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    })
  );
}
