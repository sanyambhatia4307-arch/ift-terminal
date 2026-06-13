"use client";

import { useQueries } from "@tanstack/react-query";
import axios from "axios";
import { ListChecks, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { FlashValue } from "@/components/ui/flash";
import { Panel } from "@/components/ui/panel";
import { RangeBar } from "@/components/ui/range-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkline } from "@/components/ui/sparkline";
import { StatBand, StatTile } from "@/components/ui/stat-tile";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuotes } from "@/hooks/queries";
import { changeClass, fmt, fmtPct, fmtVolume } from "@/lib/format";
import { useWatchlist } from "@/stores/watchlist";
import type { ChartResult } from "@/types/market";

function useSparks(symbols: string[]) {
  return useQueries({
    queries: symbols.map((s) => ({
      queryKey: ["chart", s, "1d", "15m"],
      queryFn: async () => {
        const res = await axios.get<{ ok: boolean; data: ChartResult }>(
          `/api/chart/${encodeURIComponent(s)}?range=1d&interval=15m`
        );
        return res.data.data;
      },
      refetchInterval: 5 * 60 * 1000,
      staleTime: 2 * 60 * 1000,
      retry: 0,
    })),
  });
}

export default function WatchlistPage() {
  const symbols = useWatchlist((s) => s.symbols);
  const remove = useWatchlist((s) => s.remove);
  const { data: quotes, isLoading, dataUpdatedAt } = useQuotes(symbols);
  const sparks = useSparks(symbols);

  const stats = useMemo(() => {
    const qs = quotes ?? [];
    if (qs.length === 0) return null;
    const changes = qs.map((q) => q.changePercent);
    const avg = changes.reduce((a, b) => a + b, 0) / changes.length;
    const best = [...qs].sort((a, b) => b.changePercent - a.changePercent)[0];
    const worst = [...qs].sort((a, b) => a.changePercent - b.changePercent)[0];
    const up = changes.filter((c) => c > 0).length;
    return { avg, best, worst, up, total: qs.length };
  }, [quotes]);

  return (
    <div className="space-y-2 p-2">
      <PageHeader
        icon={ListChecks}
        code="WLST"
        title="Watchlist"
        subtitle="Live quotes, intraday sparklines & summary · 45s refresh"
      />

      {stats && (
        <StatBand cols={4}>
          <StatTile
            label="Avg Move"
            numeric={stats.avg}
            format={(n) => fmtPct(n)}
            sub={`${stats.up} of ${stats.total} advancing`}
            tone={stats.avg >= 0 ? "bull" : "bear"}
          />
          <StatTile label="Best Performer" value={stats.best.symbol} sub={fmtPct(stats.best.changePercent)} tone="bull" />
          <StatTile label="Worst Performer" value={stats.worst.symbol} sub={fmtPct(stats.worst.changePercent)} tone="bear" />
          <StatTile label="Tracked" numeric={stats.total} format={(n) => String(Math.round(n))} sub="securities" tone="primary" />
        </StatBand>
      )}

      <Panel
        code="WL"
        title={`Holdings Watch (${symbols.length})`}
        right={
          dataUpdatedAt ? (
            <span className="num text-[10px] text-muted-foreground">
              Updated {new Date(dataUpdatedAt).toLocaleTimeString("en-IN", { hour12: false })}
            </span>
          ) : null
        }
      >
        {symbols.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            Your watchlist is empty. Use ⌘K search to find a stock, then press “Watch” on its
            research page.
          </div>
        ) : isLoading ? (
          <Skeleton className="m-2 h-64" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-[10px] uppercase tracking-wider">
                <TableHead className="h-7">Symbol</TableHead>
                <TableHead className="h-7">Name</TableHead>
                <TableHead className="h-7 w-28">Today</TableHead>
                <TableHead className="h-7 text-right">Last</TableHead>
                <TableHead className="h-7 text-right">Chg%</TableHead>
                <TableHead className="h-7 text-right">52W Range</TableHead>
                <TableHead className="h-7 text-right">Volume</TableHead>
                <TableHead className="h-7 w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {symbols.map((symbol, i) => {
                const q = quotes?.find((x) => x.symbol === symbol);
                const spark = sparks[i]?.data;
                return (
                  <TableRow key={symbol} className="text-xs">
                    <TableCell className="num py-1.5 font-medium">
                      <Link href={`/stock/${encodeURIComponent(symbol)}`} className="text-primary hover:underline">
                        {symbol}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-48 truncate py-1.5 text-muted-foreground">
                      {q?.name ?? "…"}
                    </TableCell>
                    <TableCell className="py-1.5">
                      {spark && spark.candles.length > 1 ? (
                        <div className="w-24">
                          <Sparkline candles={spark.candles} baseline={spark.previousClose} height={22} />
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="num py-1.5 text-right">
                      {q ? <FlashValue value={q.last}>{fmt(q.last)}</FlashValue> : "…"}
                    </TableCell>
                    <TableCell className={`num py-1.5 text-right ${changeClass(q?.changePercent)}`}>
                      {q ? fmtPct(q.changePercent) : ""}
                    </TableCell>
                    <TableCell className="py-1.5">
                      {q ? (
                        <div className="ml-auto w-32">
                          <RangeBar low={q.yearLow} high={q.yearHigh} last={q.last} compact />
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="num py-1.5 text-right text-muted-foreground">
                      {q ? fmtVolume(q.volume) : ""}
                    </TableCell>
                    <TableCell className="py-1.5 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-bear"
                        onClick={() => remove(symbol)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Panel>
    </div>
  );
}
