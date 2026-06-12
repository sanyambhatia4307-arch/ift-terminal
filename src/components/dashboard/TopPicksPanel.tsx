"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { TrendingUp } from "lucide-react";
import Link from "next/link";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { changeClass, fmt, fmtPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TopPick } from "@/lib/analysis/top-picks";

function useTopPicks() {
  return useQuery({
    queryKey: ["top-picks"],
    queryFn: async () => {
      const res = await axios.get<{ ok: boolean; data: TopPick[] }>("/api/top-picks");
      return res.data.data;
    },
    staleTime: 15 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
  });
}

export function TopPicksPanel() {
  const { data, isLoading } = useTopPicks();

  return (
    <Panel
      code="PICK"
      title={
        <span className="flex items-center gap-1.5">
          <TrendingUp className="h-3 w-3 text-primary" /> Top Picks · Technical Scan
        </span>
      }
      right={
        <span className="text-[10px] text-muted-foreground">NIFTY 50 universe · 30m refresh</span>
      }
    >
      {isLoading ? (
        <div className="space-y-2 p-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9" />
          ))}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 border-b border-border bg-secondary/20 px-2.5 py-1 text-[9px] uppercase tracking-wider text-muted-foreground">
            <span className="w-4 shrink-0">#</span>
            <span className="w-40 shrink-0">Stock · Sector</span>
            <span className="shrink-0">Score</span>
            <span className="flex-1">Signal</span>
            <span className="shrink-0 text-right">LTP / 3M</span>
          </div>
          <div className="divide-y divide-border/60">
            {data?.map((p, i) => (
              <Link
                key={p.symbol}
                href={`/stock/${encodeURIComponent(p.symbol)}`}
                className="flex cursor-pointer items-center gap-3 px-2.5 py-1.5 transition-colors duration-150 hover:bg-accent/40"
              >
                <span className="num w-4 shrink-0 text-[10px] text-muted-foreground">
                  {i + 1}
                </span>
                <div className="w-40 min-w-0 shrink-0">
                  <div className="num text-xs font-medium">{p.symbol}</div>
                  <div className="truncate text-[10px] text-muted-foreground">
                    {p.name} · {p.sector}
                  </div>
                </div>
                <span
                  className={cn(
                    "num shrink-0 rounded-sm border px-1.5 py-0.5 text-[10px]",
                    p.score > 0.25
                      ? "border-bull/40 bg-bull/10 text-bull"
                      : p.score < -0.1
                        ? "border-bear/40 bg-bear/10 text-bear"
                        : "border-border text-muted-foreground"
                  )}
                >
                  {p.score >= 0 ? "+" : ""}
                  {p.score.toFixed(2)}
                </span>
                <span className="flex-1 truncate text-[10px] text-muted-foreground">
                  {p.rationale}
                </span>
                <div className="num shrink-0 text-right text-[11px]">
                  <div>{fmt(p.last)}</div>
                  <div className={changeClass(p.return3M)}>
                    {p.return3M !== undefined ? `${fmtPct(p.return3M)} 3M` : ""}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="px-2.5 py-1.5 text-[9px] leading-snug text-muted-foreground">
            Ranked by trend, momentum and RSI from daily charts. Educational scan —
            not investment advice. Open a stock for the full Signal Engine view.
          </div>
        </>
      )}
    </Panel>
  );
}
