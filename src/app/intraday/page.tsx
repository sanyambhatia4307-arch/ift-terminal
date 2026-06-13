"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Crosshair } from "lucide-react";
import { useState } from "react";
import { IntradayChart } from "@/components/intraday/IntradayChart";
import { PageHeader } from "@/components/shell/PageHeader";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { StatBand, StatTile } from "@/components/ui/stat-tile";
import { TRADEABLE_INDICES, type IntradayAnalysis } from "@/lib/analysis/intraday-types";
import { changeClass, fmt, fmtPct } from "@/lib/format";
import { cn } from "@/lib/utils";

function useIntraday(key: string) {
  return useQuery({
    queryKey: ["intraday", key],
    queryFn: async () => {
      const res = await axios.get<{ ok: boolean; data: IntradayAnalysis }>(
        `/api/intraday/${encodeURIComponent(key)}`
      );
      return res.data.data;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

const BIAS_STYLES = {
  bullish: "border-bull/40 bg-bull/10 text-bull",
  bearish: "border-bear/40 bg-bear/10 text-bear",
  neutral: "border-primary/40 bg-primary/10 text-primary",
} as const;

const DIR_STYLES = {
  LONG: "bg-bull/15 text-bull border-bull/40",
  SHORT: "bg-bear/15 text-bear border-bear/40",
  WAIT: "bg-primary/15 text-primary border-primary/40",
} as const;

function LevelsTable({ a }: { a: IntradayAnalysis }) {
  const rows: Array<[string, number | undefined, string]> = [
    ["R3", a.levels.r3, "text-bear"],
    ["R2", a.levels.r2, "text-bear"],
    ["R1", a.levels.r1, "text-bear"],
    ["CPR Top", a.levels.tc, "text-primary"],
    ["Pivot", a.levels.pivot, "text-primary"],
    ["CPR Bottom", a.levels.bc, "text-primary"],
    ["S1", a.levels.s1, "text-bull"],
    ["S2", a.levels.s2, "text-bull"],
    ["S3", a.levels.s3, "text-bull"],
  ];
  return (
    <Panel code="LVLS" title="Key Levels (from prior session)">
      <div className="p-2">
        {a.levels.orHigh !== undefined && (
          <div className="num mb-1.5 flex justify-between border-b border-border/60 pb-1.5 text-[11px]">
            <span className="text-muted-foreground">Opening Range (15m)</span>
            <span>
              {fmt(a.levels.orLow)} to {fmt(a.levels.orHigh)}
            </span>
          </div>
        )}
        {rows.map(([label, value, cls]) => {
          const isNear =
            value !== undefined && Math.abs(a.last - value) / a.last < 0.0025;
          return (
            <div
              key={label}
              className={cn(
                "num flex justify-between rounded-sm px-1 py-[3px] text-[11px]",
                isNear && "bg-accent/60"
              )}
            >
              <span className={cls}>{label}</span>
              <span>{fmt(value)}</span>
            </div>
          );
        })}
        <div className="num mt-1.5 border-t border-border/60 pt-1.5 text-[10px] text-muted-foreground">
          Basis: {a.basisSession.date} · H {fmt(a.basisSession.high)} · L{" "}
          {fmt(a.basisSession.low)} · C {fmt(a.basisSession.close)}
        </div>
      </div>
    </Panel>
  );
}

function TradePlanCard({ a }: { a: IntradayAnalysis }) {
  const p = a.plan;
  return (
    <Panel code="PLAN" title="Trade Plan">
      <div className="space-y-2.5 p-2.5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-sm border px-2.5 py-1 text-sm font-semibold",
              DIR_STYLES[p.direction]
            )}
          >
            {p.direction === "WAIT" ? "WAIT / RANGE" : p.direction}
          </span>
          <span
            className={cn(
              "rounded-sm border px-1.5 py-0.5 text-[10px] uppercase",
              BIAS_STYLES[a.bias]
            )}
          >
            {a.bias} bias
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">{a.biasReason}</p>

        <div className="num grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
          <div className="col-span-2 text-foreground/90">{p.instrument}</div>
          <div className="flex justify-between border-b border-border/40 py-0.5">
            <span className="text-muted-foreground">{p.direction === "WAIT" ? "Breakout above" : "Entry"}</span>
            <span>{fmt(p.entry)}</span>
          </div>
          <div className="flex justify-between border-b border-border/40 py-0.5">
            <span className="text-muted-foreground">{p.direction === "WAIT" ? "Breakdown below" : "Stop loss"}</span>
            <span className="text-bear">{fmt(p.stop)}</span>
          </div>
          <div className="flex justify-between border-b border-border/40 py-0.5">
            <span className="text-muted-foreground">Target 1</span>
            <span className="text-bull">{fmt(p.target1)}</span>
          </div>
          <div className="flex justify-between border-b border-border/40 py-0.5">
            <span className="text-muted-foreground">Target 2</span>
            <span className="text-bull">{fmt(p.target2)}</span>
          </div>
          <div className="flex justify-between border-b border-border/40 py-0.5">
            <span className="text-muted-foreground">Risk / Reward</span>
            <span>
              {p.riskPoints} / {p.rewardPoints} pts ({p.rrRatio}:1)
            </span>
          </div>
          <div className="flex justify-between border-b border-border/40 py-0.5">
            <span className="text-muted-foreground">Lot size</span>
            <span>{p.lotSize}</span>
          </div>
        </div>

        {p.direction !== "WAIT" && (
          <div className="num grid grid-cols-3 gap-2 rounded-sm border border-border bg-background/60 p-2 text-center text-[11px]">
            <div>
              <div className="text-[9px] uppercase text-muted-foreground">P&L @ T1 / lot</div>
              <div className="text-bull">+₹{fmt(p.profitAtT1PerLot, 0)}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase text-muted-foreground">P&L @ T2 / lot</div>
              <div className="text-bull">+₹{fmt(p.profitAtT2PerLot, 0)}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase text-muted-foreground">Loss @ stop / lot</div>
              <div className="text-bear">−₹{fmt(p.lossAtStopPerLot, 0)}</div>
            </div>
          </div>
        )}

        <p className="text-[11px] leading-relaxed">{p.comment}</p>

        <p className="border-t border-border/60 pt-2 text-[9px] leading-snug text-muted-foreground">
          Computed from delayed free data using pivot/CPR/opening-range rules. Derivatives
          carry high risk; lot sizes change with exchange circulars · verify before trading.
          Educational only, not investment advice or a SEBI-registered recommendation.
        </p>
      </div>
    </Panel>
  );
}

export default function IntradayPage() {
  const [key, setKey] = useState("NIFTY");
  const { data: a, isLoading } = useIntraday(key);

  return (
    <div className="space-y-2 p-2">
      <PageHeader
        icon={Crosshair}
        code="INTR"
        title="Intraday · Index Derivatives"
        subtitle="Pivot / CPR / opening-range levels with a rule-based trade plan"
        right={
          a ? (
            <div className="num flex items-center gap-3 text-sm">
              <span className="font-medium">{fmt(a.last)}</span>
              <span className={changeClass(a.changePercent)}>{fmtPct(a.changePercent)}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px]",
                  a.marketOpen ? "bg-bull/15 text-bull" : "bg-muted text-muted-foreground"
                )}
              >
                {a.marketOpen ? "LIVE" : "LAST SESSION"}
              </span>
            </div>
          ) : null
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Instrument</span>
        <div className="flex flex-wrap gap-1">
          {TRADEABLE_INDICES.map((idx) => (
            <button
              key={idx.key}
              onClick={() => setKey(idx.key)}
              className={cn(
                "rounded-sm border px-2.5 py-1 text-xs transition-colors",
                key === idx.key
                  ? "border-primary/50 bg-accent text-primary"
                  : "border-border text-muted-foreground hover:bg-accent/50"
              )}
            >
              {idx.derivative}
            </button>
          ))}
        </div>
      </div>

      {a && (
        <StatBand cols={4}>
          <StatTile
            label="Bias"
            value={a.bias === "bullish" ? "BULLISH" : a.bias === "bearish" ? "BEARISH" : "NEUTRAL"}
            sub={`${a.plan.direction} setup`}
            tone={a.bias === "bullish" ? "bull" : a.bias === "bearish" ? "bear" : "primary"}
          />
          <StatTile label="Central Pivot" numeric={a.levels.pivot} format={(n) => fmt(n)} sub={`CPR ${fmt(a.levels.bc)} to ${fmt(a.levels.tc)}`} tone="primary" />
          <StatTile label="Nearest Support" numeric={a.levels.s1} format={(n) => fmt(n)} sub="S1 floor pivot" tone="bull" />
          <StatTile label="Nearest Resistance" numeric={a.levels.r1} format={(n) => fmt(n)} sub="R1 ceiling pivot" tone="bear" />
        </StatBand>
      )}

      {isLoading || !a ? (
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
          <Skeleton className="h-[480px] xl:col-span-2" />
          <Skeleton className="h-[480px]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
          <Panel
            code="CHRT"
            title={`${a.label} · 5-minute chart with levels`}
            className="xl:col-span-2"
            right={
              <span className="num text-[10px] text-muted-foreground">
                {new Date(a.generatedAt).toLocaleTimeString("en-IN", { hour12: false })} · refreshes 60s
              </span>
            }
          >
            <IntradayChart analysis={a} />
          </Panel>
          <div className="space-y-2">
            <TradePlanCard a={a} />
            <LevelsTable a={a} />
          </div>
        </div>
      )}
    </div>
  );
}
