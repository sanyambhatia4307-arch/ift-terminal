"use client";

import { Users2 } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useShareholding } from "@/hooks/queries";
import { cn } from "@/lib/utils";

const TREND_STYLE: Record<string, string> = {
  rising: "border-bull/40 bg-bull/10 text-bull",
  falling: "border-bear/40 bg-bear/10 text-bear",
  stable: "border-border text-muted-foreground",
};

export function Shareholding({ symbol }: { symbol: string }) {
  const { data, isLoading, isError } = useShareholding(symbol);
  const quarters = data?.quarters.filter((q) => q.promoter != null) ?? [];
  const hasData = quarters.length > 0;
  const promRange = hasData
    ? {
        min: Math.min(...quarters.map((q) => q.promoter!)),
        max: Math.max(...quarters.map((q) => q.promoter!)),
      }
    : null;

  return (
    <Panel
      code="SHLD"
      title={
        <span className="flex items-center gap-1.5">
          <Users2 className="h-3 w-3" /> Shareholding
        </span>
      }
    >
      {isLoading ? (
        <Skeleton className="m-2 h-28" />
      ) : isError || !hasData ? (
        <div className="p-3 text-xs text-muted-foreground">Shareholding pattern unavailable for this name.</div>
      ) : (
        <div className="space-y-2 p-2.5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Promoter holding</div>
              <div className="num text-xl font-semibold leading-tight">{data!.promoterLatest?.toFixed(2)}%</div>
            </div>
            <div className="text-right">
              <span className={cn("num rounded-sm border px-1.5 py-0.5 text-[10px] uppercase tracking-wide", TREND_STYLE[data!.trend])}>
                {data!.trend === "falling" ? "▼ falling" : data!.trend === "rising" ? "▲ rising" : "stable"}
              </span>
              {data!.promoterChange != null && (
                <div className="num mt-1 text-[10px] text-muted-foreground">
                  {data!.promoterChange >= 0 ? "+" : ""}
                  {data!.promoterChange.toFixed(2)} pts over {quarters.length}q
                </div>
              )}
            </div>
          </div>

          {/* per-quarter promoter trend */}
          <div className="space-y-0.5 border-t border-border/60 pt-1.5">
            {quarters.map((q) => {
              const span = promRange && promRange.max > promRange.min ? promRange.max - promRange.min : 1;
              const pct = promRange ? 12 + ((q.promoter! - promRange.min) / span) * 88 : 50;
              return (
                <div key={q.date} className="flex items-center gap-2 text-[10px]">
                  <span className="num w-20 shrink-0 text-muted-foreground">{q.date}</span>
                  <span className="relative h-2.5 flex-1 overflow-hidden rounded-sm bg-muted">
                    <span className="block h-full rounded-sm bg-primary/60" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="num w-12 shrink-0 text-right text-foreground/90">{q.promoter!.toFixed(2)}%</span>
                </div>
              );
            })}
          </div>

          {data!.trend === "falling" && (
            <p className="text-[10px] leading-snug text-bear">
              Promoter stake declined over the period · worth checking whether it reflects pledging,
              stake sales or fresh equity issuance.
            </p>
          )}
          <p className="text-[9px] leading-snug text-muted-foreground">
            Quarterly promoter vs public holding from NSE filings. Pledge and FII/DII split are not in
            this free feed; a sustained promoter-stake drop is the key red flag to watch.
          </p>
        </div>
      )}
    </Panel>
  );
}
