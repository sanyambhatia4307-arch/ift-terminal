"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { AlertTriangle, Radio } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { changeClass, fmt, fmtPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MarketPulse as MarketPulseData } from "@/lib/analysis/pulse";

function usePulse() {
  return useQuery({
    queryKey: ["pulse"],
    queryFn: async () => {
      const res = await axios.get<{ ok: boolean; data: MarketPulseData }>("/api/pulse");
      return res.data.data;
    },
    refetchInterval: 2 * 60 * 1000,
    staleTime: 60 * 1000,
  });
}

const GROUP_ORDER = ["US", "US Futures", "Asia", "Europe", "FX & Rates", "Commodities", "Crypto"];

export function MarketPulse() {
  const { data: p, isLoading } = usePulse();

  return (
    <Panel
      code="PULS"
      title={
        <span className="flex items-center gap-1.5">
          <Radio className="h-3 w-3 text-primary" /> Market Pulse · Today
        </span>
      }
      right={
        p ? (
          <span className="num text-[10px] text-muted-foreground">
            {new Date(p.generatedAt).toLocaleTimeString("en-IN", { hour12: false })} · 2m refresh
          </span>
        ) : null
      }
    >
      {isLoading || !p ? (
        <div className="space-y-2 p-2.5">
          <Skeleton className="h-8" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <div className="space-y-2.5 p-2.5">
          <p className="text-[11px] leading-relaxed">
            <span className="font-semibold text-primary">Day brief: </span>
            {p.summary}
          </p>

          {p.anomalies.length > 0 && (
            <div className="space-y-1 rounded-sm border border-border bg-background/60 p-2">
              {p.anomalies.slice(0, 5).map((a, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px] leading-snug">
                  <AlertTriangle
                    className={cn(
                      "mt-0.5 h-3 w-3 shrink-0",
                      a.severity === "high" ? "text-bear" : "text-primary"
                    )}
                  />
                  <span>{a.text}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            {GROUP_ORDER.map((group) => {
              const items = p.global.filter((g) => g.group === group);
              if (items.length === 0) return null;
              return (
                <div key={group}>
                  <div className="mb-0.5 text-[9px] font-semibold uppercase tracking-widest text-primary/70">
                    {group}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                    {items.map((g) => (
                      <div
                        key={g.symbol}
                        className="flex items-baseline justify-between text-[11px]"
                      >
                        <span className="truncate text-muted-foreground">{g.label}</span>
                        <span className="num ml-2 shrink-0">
                          {fmt(g.last)}{" "}
                          <span className={changeClass(g.changePercent)}>
                            {fmtPct(g.changePercent)}
                          </span>
                        </span>
                      </div>
                    ))}
                    {group === "FX & Rates" && p.vix && (
                      <div className="flex items-baseline justify-between text-[11px]">
                        <span className="text-muted-foreground">India VIX</span>
                        <span className="num ml-2">
                          {fmt(p.vix.last)}{" "}
                          <span className={changeClass(p.vix.changePercent)}>
                            {fmtPct(p.vix.changePercent)}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {p.flows && p.flows.length > 0 && (
            <div className="border-t border-border/60 pt-2">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Institutional Flows ({p.flows[0]?.date}) · ₹ Cr
              </div>
              <div className="space-y-1">
                {p.flows.map((f) => {
                  const max = Math.max(...p.flows!.map((x) => Math.abs(x.netValue)), 1);
                  return (
                    <div key={f.category} className="flex items-center gap-2 text-[11px]">
                      <span className="w-12 shrink-0 text-muted-foreground">
                        {f.category.startsWith("FII") ? "FII" : "DII"}
                      </span>
                      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="absolute left-1/2 top-0 h-full w-px bg-border" />
                        <div
                          className={cn(
                            "absolute top-0 h-full",
                            f.netValue >= 0 ? "bg-bull" : "bg-bear"
                          )}
                          style={{
                            width: `${(Math.abs(f.netValue) / max) * 50}%`,
                            left: f.netValue >= 0 ? "50%" : `${50 - (Math.abs(f.netValue) / max) * 50}%`,
                          }}
                        />
                      </div>
                      <span className={cn("num w-20 shrink-0 text-right", changeClass(f.netValue))}>
                        {f.netValue >= 0 ? "+" : ""}
                        {f.netValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
