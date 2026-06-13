"use client";

import { Users } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useScreener } from "@/hooks/queries";
import { fmt, fmtInrCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ScreenerRow } from "@/lib/screener";

function median(xs: Array<number | undefined>): number | undefined {
  const s = xs.filter((x): x is number => x != null && Number.isFinite(x)).sort((a, b) => a - b);
  if (!s.length) return undefined;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const n1 = (v: number | undefined, d = 1) => (v == null ? "—" : v.toFixed(d));

function scoreClass(v: number | undefined): string {
  if (v == null) return "text-muted-foreground/50";
  if (v >= 66) return "text-bull";
  if (v >= 45) return "text-primary";
  return "text-bear";
}

/** Rank of `target` among peers on a metric (1 = best). higherBetter flips direction. */
function rankOf(target: number | undefined, peers: Array<number | undefined>, higherBetter: boolean) {
  if (target == null) return null;
  const vals = peers.filter((x): x is number => x != null);
  const better = vals.filter((v) => (higherBetter ? v > target : v < target)).length;
  return { rank: better + 1, of: vals.length };
}

export function PeerComps({ symbol }: { symbol: string }) {
  const { data, isLoading } = useScreener();

  const view = useMemo(() => {
    if (!data) return null;
    const target = data.rows.find((r) => r.symbol.toUpperCase() === symbol.toUpperCase());
    if (!target?.sector) return { target: target ?? null, peers: [] as ScreenerRow[], sector: null };
    const peers = data.rows
      .filter((r) => r.sector === target.sector)
      .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0))
      .slice(0, 14);
    return { target, peers, sector: target.sector };
  }, [data, symbol]);

  const stats = useMemo(() => {
    if (!view || !view.target || view.peers.length < 2) return null;
    const { peers, target } = view;
    const medPe = median(peers.map((p) => p.pe));
    const medRoe = median(peers.map((p) => p.roe));
    const peVsMed = target.pe != null && medPe ? (target.pe / medPe - 1) * 100 : undefined;
    const peRank = rankOf(target.pe, peers.map((p) => p.pe), false); // cheaper = better
    const roeRank = rankOf(target.roe, peers.map((p) => p.roe), true);
    const scoreRank = rankOf(target.composite, peers.map((p) => p.composite), true);
    return {
      medPe,
      medRoe,
      medPb: median(peers.map((p) => p.pb)),
      medRev: median(peers.map((p) => p.revGrowth)),
      medNm: median(peers.map((p) => p.netMargin)),
      medScore: median(peers.map((p) => p.composite)),
      peVsMed,
      peRank,
      roeRank,
      scoreRank,
    };
  }, [view]);

  return (
    <Panel
      code="PEER"
      title={
        <span className="flex items-center gap-1.5">
          <Users className="h-3 w-3" /> Peer Comparison
          {view?.sector ? <span className="text-muted-foreground">· {view.sector}</span> : null}
        </span>
      }
    >
      {isLoading ? (
        <Skeleton className="m-2 h-44" />
      ) : !view || !view.target || view.peers.length < 2 ? (
        <div className="p-4 text-xs text-muted-foreground">
          No sector peers in the covered universe for this name.
        </div>
      ) : (
        <div className="space-y-2 p-2.5">
          {stats && (
            <div className="flex flex-wrap gap-1.5">
              {stats.peVsMed !== undefined && (
                <span
                  className={cn(
                    "num rounded-sm border px-1.5 py-0.5 text-[10px]",
                    stats.peVsMed <= 0
                      ? "border-bull/40 bg-bull/10 text-bull"
                      : "border-bear/40 bg-bear/10 text-bear"
                  )}
                  title="Trailing P/E vs the sector median"
                >
                  P/E {n1(view.target.pe)}x · {stats.peVsMed >= 0 ? "+" : ""}
                  {stats.peVsMed.toFixed(0)}% vs sector
                </span>
              )}
              {stats.roeRank && view.target.roe != null && (
                <span className="num rounded-sm border border-border px-1.5 py-0.5 text-[10px]" title="ROE rank within the sector">
                  ROE {n1(view.target.roe)}% · ranks {stats.roeRank.rank}/{stats.roeRank.of}
                </span>
              )}
              {stats.scoreRank && view.target.composite != null && (
                <span className="num rounded-sm border border-border px-1.5 py-0.5 text-[10px]" title="Overall composite rank within the sector">
                  Score {view.target.composite} · ranks {stats.scoreRank.rank}/{stats.scoreRank.of}
                </span>
              )}
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-[10px] uppercase tracking-wider">
                  <TableHead className="h-7">Name</TableHead>
                  <TableHead className="h-7 text-right">Mcap</TableHead>
                  <TableHead className="h-7 text-right">P/E</TableHead>
                  <TableHead className="h-7 text-right">P/B</TableHead>
                  <TableHead className="h-7 text-right">ROE%</TableHead>
                  <TableHead className="h-7 text-right">RevGr%</TableHead>
                  <TableHead className="h-7 text-right">NetM%</TableHead>
                  <TableHead className="h-7 text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {view.peers.map((p) => {
                  const isTarget = p.symbol.toUpperCase() === symbol.toUpperCase();
                  return (
                    <TableRow
                      key={p.symbol}
                      className={cn("text-[11px]", isTarget && "bg-primary/10")}
                    >
                      <TableCell className="num py-1 font-medium">
                        {isTarget ? (
                          <span className="text-primary">{p.symbol}</span>
                        ) : (
                          <Link href={`/stock/${encodeURIComponent(p.symbol)}`} className="text-foreground/90 hover:text-primary hover:underline">
                            {p.symbol}
                          </Link>
                        )}
                      </TableCell>
                      <TableCell className="num py-1 text-right text-muted-foreground">
                        {p.marketCap != null ? fmtInrCompact(p.marketCap).replace("₹", "") : "—"}
                      </TableCell>
                      <TableCell className="num py-1 text-right">{n1(p.pe)}</TableCell>
                      <TableCell className="num py-1 text-right">{n1(p.pb)}</TableCell>
                      <TableCell className="num py-1 text-right">{n1(p.roe)}</TableCell>
                      <TableCell className="num py-1 text-right">{n1(p.revGrowth)}</TableCell>
                      <TableCell className="num py-1 text-right">{n1(p.netMargin)}</TableCell>
                      <TableCell className={cn("num py-1 text-right font-semibold", scoreClass(p.composite))}>
                        {p.composite ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {stats && (
                  <TableRow className="border-t border-border text-[11px]">
                    <TableCell className="py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      Sector median
                    </TableCell>
                    <TableCell className="py-1" />
                    <TableCell className="num py-1 text-right text-muted-foreground">{n1(stats.medPe)}</TableCell>
                    <TableCell className="num py-1 text-right text-muted-foreground">{n1(stats.medPb)}</TableCell>
                    <TableCell className="num py-1 text-right text-muted-foreground">{n1(stats.medRoe)}</TableCell>
                    <TableCell className="num py-1 text-right text-muted-foreground">{n1(stats.medRev)}</TableCell>
                    <TableCell className="num py-1 text-right text-muted-foreground">{n1(stats.medNm)}</TableCell>
                    <TableCell className="num py-1 text-right text-muted-foreground">{stats.medScore != null ? Math.round(stats.medScore) : "—"}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <p className="text-[9px] leading-snug text-muted-foreground">
            Sector peers from the covered universe, largest first; the highlighted row is this name.
            Ranks compare it against listed peers (P/E lower = better). Fundamentals via Yahoo.
          </p>
        </div>
      )}
    </Panel>
  );
}
