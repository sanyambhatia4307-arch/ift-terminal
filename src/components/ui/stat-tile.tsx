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

/** Hairline-ruled metric grid · the wrapper for any group of StatTiles. */
export const STAT_GRID =
  "stagger grid gap-px overflow-hidden rounded-lg border border-border bg-border";

/** One metric cell: small label, big number, quiet sub-line. Colour lives in the value only. */
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
    <div className={cn("panel-rise relative flex flex-col justify-center bg-card px-4 py-3.5", className)}>
      <div className="text-[11.5px] text-muted-foreground">{label}</div>
      <div className={cn("num mt-1.5 truncate text-[23px] font-semibold leading-none tracking-tight", TONE_TEXT[tone])}>
        {numeric !== undefined && format ? <AnimatedNumber value={numeric} format={format} /> : value}
      </div>
      {sub && <div className="num mt-2 truncate text-[10.5px] leading-tight text-muted-foreground">{sub}</div>}
      {spark && spark.length > 1 && (
        <div className="mt-1.5 -mb-1">
          <Sparkline candles={spark} baseline={sparkBaseline} height={20} />
        </div>
      )}
    </div>
  );
}

/** Responsive row of metrics separated by hairlines, like a terminal quote strip. */
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
  return <div className={cn(STAT_GRID, "grid-cols-2", colClass)}>{children}</div>;
}
