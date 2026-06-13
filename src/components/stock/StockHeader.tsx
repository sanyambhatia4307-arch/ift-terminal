"use client";

import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RangeBar } from "@/components/ui/range-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuote } from "@/hooks/queries";
import { changeClass, fmt, fmtChange, fmtPct, fmtVolume } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useWatchlist } from "@/stores/watchlist";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="num text-[12px] text-foreground">{children}</div>
    </div>
  );
}

export function StockHeader({ symbol }: { symbol: string }) {
  const { data: q, isLoading } = useQuote(symbol);
  const inWatchlist = useWatchlist((s) => s.symbols.includes(symbol));
  const add = useWatchlist((s) => s.add);
  const remove = useWatchlist((s) => s.remove);

  if (isLoading) return <Skeleton className="h-20" />;
  if (!q) return null;

  const up = q.change >= 0;

  return (
    <div className="surface-panel relative overflow-hidden rounded-md border border-border">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(60% 140% at 0% 0%, color-mix(in oklab, ${up ? "var(--bull)" : "var(--bear)"} 15%, transparent), transparent 60%)`,
        }}
      />
      <div className="relative flex flex-wrap items-center gap-x-8 gap-y-3 px-3 py-2.5">
        {/* Identity + price */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-base font-semibold leading-tight">{q.name}</h1>
            <span className="num shrink-0 rounded-sm border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {symbol} · {q.exchange ?? "NSE"}
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="num text-2xl font-semibold leading-none tracking-tight">₹{fmt(q.last)}</span>
            <span className={cn("num text-sm", changeClass(q.change))}>
              {fmtChange(q.change)} ({fmtPct(q.changePercent)})
            </span>
          </div>
        </div>

        {/* Compact data fields */}
        <Field label="Prev Close">{fmt(q.previousClose)}</Field>
        <Field label="Volume">{fmtVolume(q.volume)}</Field>
        {q.asOf ? (
          <Field label="Last Trade">
            {new Date(q.asOf * 1000).toLocaleTimeString("en-IN", { hour12: false, timeZone: "Asia/Kolkata" })} IST
          </Field>
        ) : null}

        {/* Range bars */}
        <div className="w-40">
          <RangeBar low={q.low} high={q.high} last={q.last} label="Day Range" compact />
        </div>
        <div className="w-44">
          <RangeBar low={q.yearLow} high={q.yearHigh} last={q.last} label="52-Week Range" compact />
        </div>

        <Button
          size="sm"
          variant={inWatchlist ? "secondary" : "outline"}
          className="ml-auto h-7 shrink-0 gap-1.5 text-xs"
          onClick={() => (inWatchlist ? remove(symbol) : add(symbol))}
        >
          <Star className={cn("h-3 w-3", inWatchlist && "fill-primary text-primary")} />
          {inWatchlist ? "Watching" : "Watch"}
        </Button>
      </div>
    </div>
  );
}
