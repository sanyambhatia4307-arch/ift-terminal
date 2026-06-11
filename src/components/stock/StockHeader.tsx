"use client";

import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuote } from "@/hooks/queries";
import { changeClass, fmt, fmtChange, fmtPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useWatchlist } from "@/stores/watchlist";

export function StockHeader({ symbol }: { symbol: string }) {
  const { data: q, isLoading } = useQuote(symbol);
  const inWatchlist = useWatchlist((s) => s.symbols.includes(symbol));
  const add = useWatchlist((s) => s.add);
  const remove = useWatchlist((s) => s.remove);

  if (isLoading) return <Skeleton className="h-16" />;
  if (!q) return null;

  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-2 rounded-sm border border-border bg-card px-3 py-2.5">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold leading-tight">{q.name}</h1>
          <span className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {symbol} · {q.exchange ?? "NSE"}
          </span>
        </div>
        <div className="mt-1 flex items-baseline gap-3">
          <span className="num text-2xl font-medium leading-none">₹{fmt(q.last)}</span>
          <span className={cn("num text-sm", changeClass(q.change))}>
            {fmtChange(q.change)} ({fmtPct(q.changePercent)})
          </span>
        </div>
      </div>

      <div className="num flex gap-5 text-[11px] text-muted-foreground">
        <div>
          <div>Prev Close</div>
          <div className="text-foreground">{fmt(q.previousClose)}</div>
        </div>
        <div>
          <div>Day Range</div>
          <div className="text-foreground">
            {fmt(q.low)} – {fmt(q.high)}
          </div>
        </div>
        <div>
          <div>52W Range</div>
          <div className="text-foreground">
            {fmt(q.yearLow)} – {fmt(q.yearHigh)}
          </div>
        </div>
        {q.asOf ? (
          <div>
            <div>Last Trade</div>
            <div className="text-foreground">
              {new Date(q.asOf * 1000).toLocaleTimeString("en-IN", {
                hour12: false,
                timeZone: "Asia/Kolkata",
              })}{" "}
              IST
            </div>
          </div>
        ) : null}
      </div>

      <Button
        size="sm"
        variant={inWatchlist ? "secondary" : "outline"}
        className="ml-auto h-7 gap-1.5 text-xs"
        onClick={() => (inWatchlist ? remove(symbol) : add(symbol))}
      >
        <Star className={cn("h-3 w-3", inWatchlist && "fill-primary text-primary")} />
        {inWatchlist ? "Watching" : "Watch"}
      </Button>
    </div>
  );
}
