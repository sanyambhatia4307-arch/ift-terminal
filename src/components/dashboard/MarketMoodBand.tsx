"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { BreadthGauge } from "@/components/dashboard/BreadthGauge";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { useChart, useIndices, useMovers } from "@/hooks/queries";
import type { MarketPulse } from "@/lib/analysis/pulse";
import { changeClass, fmt, fmtPct } from "@/lib/format";
import { cn } from "@/lib/utils";

function usePulse() {
  return useQuery({
    queryKey: ["pulse"],
    queryFn: async () => {
      const res = await axios.get<{ ok: boolean; data: MarketPulse }>("/api/pulse");
      return res.data.data;
    },
    refetchInterval: 2 * 60 * 1000,
    staleTime: 60 * 1000,
  });
}

function HeroArea({ symbol }: { symbol: string }) {
  const { data } = useChart(symbol, "1d", "15m");
  const candles = data?.candles ?? [];
  if (candles.length < 2) return <div className="h-16" />;

  const closes = candles.map((c) => c.close);
  const base = data?.previousClose ?? closes[0];
  const min = Math.min(...closes, base);
  const max = Math.max(...closes, base);
  const span = max - min || 1;
  const W = 100;
  const H = 32;
  const x = (i: number) => (i / (closes.length - 1)) * W;
  const y = (v: number) => H - ((v - min) / span) * (H - 2) - 1;
  const line = closes.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(" ");
  const up = closes[closes.length - 1] >= base;
  const color = up ? "var(--bull)" : "var(--bear)";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-16 w-full" aria-hidden>
      <defs>
        <linearGradient id="hero-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" x2={W} y1={y(base)} y2={y(base)} stroke="var(--flat)" strokeOpacity="0.3" strokeWidth="0.5" strokeDasharray="2 2" />
      <path d={`${line} L${W},${H} L0,${H} Z`} fill="url(#hero-fill)" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function MarketMoodBand() {
  const { data: indices } = useIndices();
  const { data: movers } = useMovers();
  const { data: pulse } = usePulse();

  const nifty = indices?.headline.find((i) => i.symbol === "NIFTY 50") ?? indices?.headline[0];
  const vix = pulse?.vix;
  const fii = pulse?.flows?.find((f) => f.category.startsWith("FII"));
  const dii = pulse?.flows?.find((f) => f.category === "DII");

  return (
    <div className="panel-rise surface-panel relative overflow-hidden rounded-md border border-border">
      {/* tinted hero glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 120% at 0% 0%, color-mix(in oklab, var(--primary) 9%, transparent), transparent 60%)",
        }}
      />
      <div className="relative grid grid-cols-1 gap-4 p-3 lg:grid-cols-[1.5fr_0.9fr_1.1fr]">
        {/* NIFTY + intraday area */}
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[12.5px] font-medium tracking-[-0.005em] text-foreground/90">Live market snapshot</span>
            <span className="num text-[9.5px] tracking-[0.14em] text-muted-foreground/45">MOOD</span>
          </div>
          {nifty && (
            <Link href="/stock/NIFTY 50" className="group mt-1 flex items-baseline gap-3">
              <span className="text-[13px] font-semibold group-hover:text-primary">NIFTY 50</span>
              <AnimatedNumber
                value={nifty.last}
                format={(n) => fmt(n)}
                className="num text-3xl font-semibold leading-none tracking-tight"
              />
              <span className={cn("num text-sm", changeClass(nifty.change))}>
                {nifty.change > 0 ? "+" : ""}
                {fmt(nifty.change)} ({fmtPct(nifty.changePercent)})
              </span>
            </Link>
          )}
          <div className="mt-1.5">
            <HeroArea symbol="NIFTY 50" />
          </div>
        </div>

        {/* breadth gauge */}
        <div className="flex items-center justify-center border-border lg:border-x lg:px-2">
          {movers ? (
            <BreadthGauge
              advancing={movers.advances ?? 0}
              declining={movers.declines ?? 0}
              unchanged={movers.unchanged ?? 0}
            />
          ) : (
            <div className="h-28" />
          )}
        </div>

        {/* macro chips + brief */}
        <div className="flex min-w-0 flex-col justify-center gap-1.5">
          <div className="grid grid-cols-3 gap-1.5">
            <Chip label="India VIX" value={vix ? fmt(vix.last) : "n/a"} sub={vix ? fmtPct(vix.changePercent) : ""} tone={vix && vix.changePercent > 0 ? "bear" : "bull"} />
            <Chip label="FII (₹Cr)" value={fii ? Math.round(fii.netValue).toLocaleString("en-IN") : "n/a"} sub={fii && fii.netValue >= 0 ? "net buy" : "net sell"} tone={fii && fii.netValue >= 0 ? "bull" : "bear"} />
            <Chip label="DII (₹Cr)" value={dii ? Math.round(dii.netValue).toLocaleString("en-IN") : "n/a"} sub={dii && dii.netValue >= 0 ? "net buy" : "net sell"} tone={dii && dii.netValue >= 0 ? "bull" : "bear"} />
          </div>
          {pulse?.summary && (
            <p className="line-clamp-3 text-[11px] leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">Brief · </span>
              {pulse.summary}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "bull" | "bear";
}) {
  return (
    <div className="rounded-sm border border-border bg-background/50 px-2 py-1">
      <div className="text-[10.5px] text-muted-foreground">{label}</div>
      <div className="num truncate text-xs font-medium">{value}</div>
      <div className={cn("num text-[9px]", tone === "bull" ? "text-bull" : tone === "bear" ? "text-bear" : "text-muted-foreground")}>
        {sub}
      </div>
    </div>
  );
}
