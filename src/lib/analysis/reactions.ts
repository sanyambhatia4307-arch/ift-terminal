import { getChart } from "@/lib/market";
import { nseResultsDates } from "@/lib/sources/nse";
import { yahooEarningsHistory, type EpsSurprise } from "@/lib/sources/yahoo";

/**
 * Results-reaction history: how the stock actually moved across each of its
 * recent earnings prints. Result dates come from NSE's board-meeting
 * calendar; since announcements land both intraday and post-close, the
 * reaction is measured close-before-print → first close after the print
 * (spans the announcement either way).
 */

export interface ResultReaction {
  date: string; // ISO announcement date
  reactionPct: number;
  prevClose: number;
  postClose: number;
}

export interface ReactionsResult {
  symbol: string;
  reactions: ResultReaction[];
  stats: {
    count: number;
    avgPct: number;
    medianPct: number;
    positiveRate: number; // 0..1
    bestPct: number;
    worstPct: number;
    avgAbsPct: number; // typical magnitude — sizing input
  } | null;
  surprises: EpsSurprise[];
  generatedAt: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function buildReactions(symbol: string): Promise<ReactionsResult> {
  const [dates, chart, surprises] = await Promise.all([
    nseResultsDates(symbol, 9).catch(() => [] as Date[]),
    getChart(symbol, "5y", "1d"),
    yahooEarningsHistory(symbol).catch(() => []),
  ]);

  const candles = chart.candles;
  const reactions: ResultReaction[] = [];

  for (const d of dates) {
    const t = d.getTime() / 1000;
    // Last close strictly before the announcement day…
    let prevIdx = -1;
    for (let i = candles.length - 1; i >= 0; i--) {
      if (candles[i].time < t - 6 * 3600) {
        prevIdx = i;
        break;
      }
    }
    // …and the first close after the announcement day ends.
    let postIdx = -1;
    for (let i = 0; i < candles.length; i++) {
      if (candles[i].time > t + 18 * 3600) {
        postIdx = i;
        break;
      }
    }
    if (prevIdx < 0 || postIdx < 0 || postIdx <= prevIdx) continue;
    const prevClose = candles[prevIdx].close;
    const postClose = candles[postIdx].close;
    reactions.push({
      date: d.toISOString().slice(0, 10),
      reactionPct: round2(((postClose - prevClose) / prevClose) * 100),
      prevClose: round2(prevClose),
      postClose: round2(postClose),
    });
  }

  reactions.sort((a, b) => (a.date < b.date ? 1 : -1));
  const kept = reactions.slice(0, 8);

  let stats: ReactionsResult["stats"] = null;
  if (kept.length >= 3) {
    const moves = kept.map((r) => r.reactionPct);
    const sorted = [...moves].sort((a, b) => a - b);
    stats = {
      count: kept.length,
      avgPct: round2(moves.reduce((a, b) => a + b, 0) / moves.length),
      medianPct: round2(sorted[Math.floor(sorted.length / 2)]),
      positiveRate: round2(moves.filter((m) => m > 0).length / moves.length),
      bestPct: round2(Math.max(...moves)),
      worstPct: round2(Math.min(...moves)),
      avgAbsPct: round2(moves.reduce((a, b) => a + Math.abs(b), 0) / moves.length),
    };
  }

  return { symbol, reactions: kept, stats, surprises, generatedAt: Date.now() };
}
