"use client";

import { fmt } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Where the current price sits between a low and a high, the classic
 * 52-week-range marker used on professional terminals. Low (red) to high
 * (green); the pin marks the live price.
 */
export function RangeBar({
  low,
  high,
  last,
  label,
  compact = false,
}: {
  low?: number;
  high?: number;
  last?: number;
  label?: string;
  compact?: boolean;
}) {
  if (low === undefined || high === undefined || last === undefined || high <= low) {
    return <span className="num text-[10px] text-muted-foreground">n/a</span>;
  }
  const t = Math.max(0, Math.min(1, (last - low) / (high - low)));
  const pct = Math.round(t * 100);

  return (
    <div className={cn("min-w-0", compact ? "w-full" : "w-full max-w-[200px]")}>
      {label && (
        <div className="flex items-baseline justify-between text-[9px] uppercase tracking-wider text-muted-foreground">
          <span>{label}</span>
          <span className="num">{pct}%</span>
        </div>
      )}
      <div
        className="relative mt-0.5 h-1.5 rounded-full"
        style={{
          background:
            "linear-gradient(90deg, color-mix(in oklab, var(--bear) 55%, transparent), color-mix(in oklab, var(--flat) 30%, transparent) 50%, color-mix(in oklab, var(--bull) 60%, transparent))",
        }}
      >
        <span
          className="absolute top-1/2 h-3 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground ring-1 ring-card"
          style={{ left: `${t * 100}%` }}
        />
      </div>
      <div className="num mt-0.5 flex justify-between text-[9px] text-muted-foreground">
        <span>{fmt(low)}</span>
        <span>{fmt(high)}</span>
      </div>
    </div>
  );
}
