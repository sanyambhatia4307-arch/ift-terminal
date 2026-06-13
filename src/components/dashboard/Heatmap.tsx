"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtPct } from "@/lib/format";
import type { StockQuote } from "@/types/market";

function useConstituents(index: string) {
  return useQuery({
    queryKey: ["constituents", index],
    queryFn: async () => {
      const res = await axios.get<{ ok: boolean; data: { stocks: StockQuote[] } }>(
        `/api/constituents?index=${encodeURIComponent(index)}`
      );
      return res.data.data.stocks;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

// Background intensity scales with |change|, capped at ±3%.
function tileBg(change: number): string {
  const intensity = Math.min(1, Math.abs(change) / 3);
  const base = change >= 0 ? "var(--bull)" : "var(--bear)";
  const mix = 12 + intensity * 52; // 12%→64%
  return `color-mix(in oklab, ${base} ${mix}%, var(--card))`;
}

export function Heatmap({ className }: { className?: string }) {
  const { data, isLoading } = useConstituents("NIFTY 50");
  const stocks = (data ?? []).slice().sort((a, b) => b.changePercent - a.changePercent);

  return (
    <Panel
      code="HMAP"
      title="NIFTY 50 Heatmap"
      className={className}
      right={
        stocks.length > 0 ? (
          <span className="num text-[10px] text-muted-foreground">
            <span className="text-bull">{stocks.filter((s) => s.changePercent >= 0).length}</span>
            <span className="mx-0.5 text-muted-foreground">/</span>
            <span className="text-bear">{stocks.filter((s) => s.changePercent < 0).length}</span> · color = % move
          </span>
        ) : null
      }
    >
      {isLoading ? (
        <Skeleton className="m-2 h-72" />
      ) : (
        <div className="grid h-full auto-rows-fr grid-cols-4 gap-px p-px sm:grid-cols-6 lg:grid-cols-8">
          {stocks.map((s) => (
            <Link
              key={s.symbol}
              href={`/stock/${encodeURIComponent(s.symbol)}`}
              title={`${s.name ?? s.symbol} · ${fmtPct(s.changePercent)}`}
              className="group flex min-h-[40px] flex-col items-center justify-center px-0.5 py-1 text-center transition-transform duration-150 hover:z-10 hover:scale-[1.06] hover:ring-1 hover:ring-primary/50"
              style={{ backgroundColor: tileBg(s.changePercent) }}
            >
              <span className="num w-full truncate text-[9.5px] font-semibold leading-tight">
                {s.symbol}
              </span>
              <span className="num text-[9px] leading-tight opacity-90">
                {fmtPct(s.changePercent)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </Panel>
  );
}
