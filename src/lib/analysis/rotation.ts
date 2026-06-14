import { getChart } from "@/lib/market";
import { cached } from "@/lib/cache";

/**
 * Sector rotation / relative-strength engine.
 *
 * Measures each NSE sector index against the NIFTY 50 over multiple horizons
 * and places it in a Relative Rotation Graph quadrant (Leading / Weakening /
 * Lagging / Improving) from its relative-strength level and the momentum of
 * that relative strength. This is how desks spot leadership moving between
 * sectors before it shows up in a single day's move.
 */

export type Quadrant = "Leading" | "Weakening" | "Lagging" | "Improving";

export interface SectorRS {
  name: string;
  symbol: string; // Yahoo sector-index symbol
  ret1M?: number;
  ret3M?: number;
  ret6M?: number;
  rs1M?: number; // sector return − NIFTY return
  rs3M?: number;
  rs6M?: number;
  rsLevel?: number; // medium-term relative strength (rs3M)
  rsMomentum?: number; // rs1M − rs3M (improving when positive)
  rsScore?: number; // blended rank score
  quadrant?: Quadrant;
}

export interface RotationPayload {
  benchmark: { name: string; ret1M?: number; ret3M?: number; ret6M?: number };
  sectors: SectorRS[];
  generatedAt: number;
}

const BENCH = "^NSEI";
const SECTORS: Array<{ name: string; symbol: string }> = [
  { name: "Bank", symbol: "^NSEBANK" },
  { name: "IT", symbol: "^CNXIT" },
  { name: "Auto", symbol: "^CNXAUTO" },
  { name: "Pharma", symbol: "^CNXPHARMA" },
  { name: "FMCG", symbol: "^CNXFMCG" },
  { name: "Metal", symbol: "^CNXMETAL" },
  { name: "Realty", symbol: "^CNXREALTY" },
  { name: "Energy", symbol: "^CNXENERGY" },
  { name: "Fin Services", symbol: "NIFTY_FIN_SERVICE.NS" },
  { name: "PSU Bank", symbol: "^CNXPSUBANK" },
  { name: "Media", symbol: "^CNXMEDIA" },
  { name: "Infra", symbol: "^CNXINFRA" },
];

function returnsOf(closes: number[]) {
  const last = closes[closes.length - 1];
  const at = (n: number) => {
    const i = closes.length - 1 - n;
    return i >= 0 && closes[i] > 0 ? (last / closes[i] - 1) * 100 : undefined;
  };
  return {
    r1: at(21),
    r3: at(63),
    r6: closes[0] > 0 ? (last / closes[0] - 1) * 100 : undefined,
  };
}

function quadrantOf(level: number, momentum: number): Quadrant {
  if (level >= 0) return momentum >= 0 ? "Leading" : "Weakening";
  return momentum >= 0 ? "Improving" : "Lagging";
}

async function closesFor(symbol: string): Promise<number[] | null> {
  try {
    const chart = await getChart(symbol, "6mo", "1d");
    const closes = chart.candles.map((c) => c.close).filter((c) => c > 0);
    return closes.length >= 30 ? closes : null;
  } catch {
    return null;
  }
}

async function assemble(): Promise<RotationPayload> {
  const benchCloses = await closesFor(BENCH);
  const b = benchCloses ? returnsOf(benchCloses) : { r1: undefined, r3: undefined, r6: undefined };

  const sectors = await Promise.all(
    SECTORS.map(async ({ name, symbol }) => {
      const closes = await closesFor(symbol);
      if (!closes) return { name, symbol } satisfies SectorRS;
      const r = returnsOf(closes);
      const rs1M = r.r1 != null && b.r1 != null ? r.r1 - b.r1 : undefined;
      const rs3M = r.r3 != null && b.r3 != null ? r.r3 - b.r3 : undefined;
      const rs6M = r.r6 != null && b.r6 != null ? r.r6 - b.r6 : undefined;
      const rsLevel = rs3M;
      const rsMomentum = rs1M != null && rs3M != null ? rs1M - rs3M : undefined;
      const rsScore =
        (rs3M ?? 0) * 0.5 + (rs1M ?? 0) * 0.3 + (rs6M ?? 0) * 0.2;
      return {
        name,
        symbol,
        ret1M: round(r.r1),
        ret3M: round(r.r3),
        ret6M: round(r.r6),
        rs1M: round(rs1M),
        rs3M: round(rs3M),
        rs6M: round(rs6M),
        rsLevel: round(rsLevel),
        rsMomentum: round(rsMomentum),
        rsScore: round(rsScore),
        quadrant: rsLevel != null && rsMomentum != null ? quadrantOf(rsLevel, rsMomentum) : undefined,
      } satisfies SectorRS;
    })
  );

  sectors.sort((a, c) => (c.rsScore ?? -999) - (a.rsScore ?? -999));

  return {
    benchmark: { name: "NIFTY 50", ret1M: round(b.r1), ret3M: round(b.r3), ret6M: round(b.r6) },
    sectors,
    generatedAt: Date.now(),
  };
}

const round = (n?: number) => (n == null ? undefined : Math.round(n * 10) / 10);

export function getRotation(): Promise<RotationPayload> {
  return cached("rotation:v1", 15 * 60 * 1000, assemble);
}
