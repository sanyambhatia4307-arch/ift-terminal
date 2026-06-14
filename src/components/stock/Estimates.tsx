"use client";

import { TrendingUp } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useEstimates } from "@/hooks/queries";
import { fmt } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EstimatePeriod } from "@/types/market";

function Period({ p }: { p: EstimatePeriod }) {
  return (
    <div className="flex items-baseline justify-between text-[11px]">
      <span className="text-muted-foreground">{p.label}</span>
      <span className="num">
        EPS ₹{p.eps != null ? fmt(p.eps) : "—"}
        {p.growth != null && (
          <span className={cn("ml-1.5", p.growth >= 0 ? "text-bull" : "text-bear")}>
            {p.growth >= 0 ? "+" : ""}
            {(p.growth * 100).toFixed(1)}%
          </span>
        )}
        {p.analysts != null && <span className="ml-1.5 text-muted-foreground">· {p.analysts} an.</span>}
      </span>
    </div>
  );
}

export function Estimates({ symbol }: { symbol: string }) {
  const { data, isLoading, isError } = useEstimates(symbol);
  const up = data?.current?.up30 ?? 0;
  const down = data?.current?.down30 ?? 0;
  const hasData = data?.current?.eps != null || up + down > 0;

  const trend = data?.revisionTrend;
  const trendStyle =
    trend === "up"
      ? "border-bull/40 bg-bull/10 text-bull"
      : trend === "down"
        ? "border-bear/40 bg-bear/10 text-bear"
        : "border-border text-muted-foreground";

  return (
    <Panel
      code="EST"
      title={
        <span className="flex items-center gap-1.5">
          <TrendingUp className="h-3 w-3" /> Analyst Estimates
        </span>
      }
    >
      {isLoading ? (
        <Skeleton className="m-2 h-20" />
      ) : isError || !hasData ? (
        <div className="p-3 text-xs text-muted-foreground">No analyst estimate coverage.</div>
      ) : (
        <div className="space-y-2 p-2.5">
          {up + down > 0 && (
            <div className="flex items-center justify-between">
              <span className={cn("num rounded-sm border px-1.5 py-0.5 text-[10px] uppercase tracking-wide", trendStyle)}>
                {trend === "up" ? "Estimates rising" : trend === "down" ? "Estimates falling" : "Estimates flat"}
              </span>
              <span className="num text-[11px]">
                <span className="text-bull">▲ {up}</span>
                <span className="mx-1 text-muted-foreground">/</span>
                <span className="text-bear">▼ {down}</span>
                <span className="ml-1 text-muted-foreground">revisions · 30d</span>
              </span>
            </div>
          )}
          <div className="space-y-1 border-t border-border/60 pt-1.5">
            {data?.current && <Period p={data.current} />}
            {data?.next && <Period p={data.next} />}
          </div>
          <p className="text-[9px] leading-snug text-muted-foreground">
            Forward consensus EPS and the count of upward vs downward analyst revisions over the last 30
            days · a leading signal that also feeds the Sentiment pillar. Via Yahoo.
          </p>
        </div>
      )}
    </Panel>
  );
}
