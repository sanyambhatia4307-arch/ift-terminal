"use client";

import { useQueries } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { FlashValue } from "@/components/ui/flash";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkline } from "@/components/ui/sparkline";
import { useIndices } from "@/hooks/queries";
import { changeClass, fmt, fmtPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ChartResult } from "@/types/market";

function useIndexSparks(symbols: string[]) {
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

export function IndicesGrid() {
  const { data, isLoading, dataUpdatedAt } = useIndices();
  const symbols = (data?.headline ?? []).map((i) => i.symbol);
  const sparks = useIndexSparks(symbols);

  return (
    <Panel
      code="IDX"
      title="Major Indices"
      right={
        dataUpdatedAt ? (
          <span className="num text-[10px] text-muted-foreground">
            {new Date(dataUpdatedAt).toLocaleTimeString("en-IN", { hour12: false })} ·{" "}
            {data?.source?.toUpperCase()} · click a tile for full view
          </span>
        ) : null
      }
    >
      {isLoading ? (
        <div className="grid grid-cols-4 gap-px p-px">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[88px] rounded-none" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-4">
          {data?.headline.map((idx, i) => {
            const spark = sparks[i]?.data;
            return (
              <Link
                key={idx.symbol}
                href={`/stock/${encodeURIComponent(idx.symbol)}`}
                className="group cursor-pointer bg-card px-2.5 py-2 transition-colors duration-150"
              >
                <div className="truncate text-[11px] text-muted-foreground group-hover:text-foreground">
                  {idx.name}
                </div>
                <div className="num mt-0.5 text-base font-medium leading-tight">
                  <FlashValue value={idx.last}>{fmt(idx.last)}</FlashValue>
                </div>
                <div className={cn("num text-xs", changeClass(idx.change))}>
                  {idx.change > 0 ? "+" : ""}
                  {fmt(idx.change)} ({fmtPct(idx.changePercent)})
                </div>
                {spark && spark.candles.length > 1 ? (
                  <div className="mt-1">
                    <Sparkline candles={spark.candles} baseline={spark.previousClose} />
                  </div>
                ) : idx.pe ? (
                  <div className="num mt-1 text-[10px] text-muted-foreground">
                    P/E {idx.pe.toFixed(1)} · P/B {idx.pb?.toFixed(1) ?? "—"} · Yld{" "}
                    {idx.divYield?.toFixed(2) ?? "—"}%
                  </div>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
