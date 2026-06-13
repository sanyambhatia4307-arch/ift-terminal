"use client";

import { AnimatedNumber } from "@/components/ui/animated-number";
import { Sparkline } from "@/components/ui/sparkline";
import { cn } from "@/lib/utils";
import type { Candle } from "@/types/market";

export type Tone = "bull" | "bear" | "neutral" | "primary";

const TONE_TEXT: Record<Tone, string> = {
  bull: "text-bull",
  bear: "text-bear",
  neutral: "text-foreground",
  primary: "text-primary",
};

const TONE_GLOW: Record<Tone, string> = {
  bull: "color-mix(in oklab, var(--bull) 15%, transparent)",
  bear: "color-mix(in oklab, var(--bear) 15%, transparent)",
  neutral: "transparent",
  primary: "color-mix(in oklab, var(--primary) 15%, transparent)",
};

/** A single KPI card: label, animated value, sub-line, optional sparkline. */
export function StatTile({
  label,
  value,
  numeric,
  format,
  sub,
  tone = "neutral",
  spark,
  sparkBaseline,
  className,
}: {
  label: string;
  value?: string; // static value (use this OR numeric)
  numeric?: number; // animated value
  format?: (n: number) => string;
  sub?: React.ReactNode;
  tone?: Tone;
  spark?: Candle[];
  sparkBaseline?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "panel-rise hover-glow surface-panel relative flex flex-col justify-center overflow-hidden rounded-sm border border-border px-2.5 py-2",
        className
      )}
      style={{
        background: `linear-gradient(180deg, ${TONE_GLOW[tone]}, transparent 72%), var(--card)`,
      }}
    >
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("num mt-0.5 text-lg font-semibold leading-tight", TONE_TEXT[tone])}>
        {numeric !== undefined && format ? (
          <AnimatedNumber value={numeric} format={format} />
        ) : (
          value
        )}
      </div>
      {sub && <div className="num text-[10px] leading-tight text-muted-foreground">{sub}</div>}
      {spark && spark.length > 1 && (
        <div className="mt-1 -mb-1">
          <Sparkline candles={spark} baseline={sparkBaseline} height={20} />
        </div>
      )}
    </div>
  );
}

/** Responsive row of stat tiles with staggered entrance. */
export function StatBand({
  children,
  cols = 4,
}: {
  children: React.ReactNode;
  cols?: 3 | 4 | 5 | 6;
}) {
  const colClass =
    cols === 6
      ? "md:grid-cols-3 lg:grid-cols-6"
      : cols === 5
        ? "md:grid-cols-3 lg:grid-cols-5"
        : cols === 3
          ? "sm:grid-cols-3"
          : "sm:grid-cols-2 lg:grid-cols-4";
  return <div className={cn("stagger grid grid-cols-2 gap-2", colClass)}>{children}</div>;
}
