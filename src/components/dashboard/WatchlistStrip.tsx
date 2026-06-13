"use client";

import Link from "next/link";
import { Panel } from "@/components/ui/panel";
import { useQuotes } from "@/hooks/queries";
import { changeClass, fmt, fmtPct } from "@/lib/format";
import { useWatchlist } from "@/stores/watchlist";

export function WatchlistStrip() {
  const symbols = useWatchlist((s) => s.symbols);
  const { data: quotes } = useQuotes(symbols);

  return (
    <Panel
      code="WL"
      title="Watchlist"
      right={
        <Link href="/watchlist" className="text-[10px] text-primary hover:underline">
          Manage →
        </Link>
      }
    >
      <div className="flex divide-x divide-border/60 overflow-x-auto">
        {symbols.map((symbol) => {
          const q = quotes?.find((x) => x.symbol === symbol);
          return (
            <Link
              key={symbol}
              href={`/stock/${encodeURIComponent(symbol)}`}
              className="min-w-28 shrink-0 px-2.5 py-1.5 transition-colors hover:bg-accent/40"
            >
              <div className="num text-[11px] font-medium">{symbol}</div>
              <div className="num text-xs">{q ? fmt(q.last) : "…"}</div>
              <div className={`num text-[11px] ${changeClass(q?.changePercent)}`}>
                {q ? fmtPct(q.changePercent) : ""}
              </div>
            </Link>
          );
        })}
        {symbols.length === 0 && (
          <div className="p-3 text-xs text-muted-foreground">
            Watchlist empty · add stocks from any research page.
          </div>
        )}
      </div>
    </Panel>
  );
}
