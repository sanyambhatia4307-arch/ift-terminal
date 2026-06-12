"use client";

import Link from "next/link";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useMovers } from "@/hooks/queries";
import { changeClass, fmt, fmtPct } from "@/lib/format";
import type { Mover } from "@/types/market";

function MoverHeader() {
  return (
    <div className="flex items-center gap-2 border-b border-border bg-secondary/20 px-2.5 py-1 text-[9px] uppercase tracking-wider text-muted-foreground">
      <span className="w-24 shrink-0">Symbol</span>
      <span className="flex-1">Company</span>
      <span>LTP</span>
      <span className="w-16 text-right">Chg %</span>
    </div>
  );
}

function MoverRow({ mover }: { mover: Mover }) {
  return (
    <Link
      href={`/stock/${encodeURIComponent(mover.symbol)}`}
      className="flex cursor-pointer items-center gap-2 px-2.5 py-[5px] text-xs transition-colors duration-150 hover:bg-accent/40"
    >
      <span className="num w-24 shrink-0 truncate font-medium">{mover.symbol}</span>
      <span className="flex-1 truncate text-[11px] text-muted-foreground">
        {mover.name ?? ""}
      </span>
      <span className="num">{fmt(mover.last)}</span>
      <span className={`num w-16 text-right ${changeClass(mover.changePercent)}`}>
        {fmtPct(mover.changePercent)}
      </span>
    </Link>
  );
}

export function MoversPanel({ count = 6 }: { count?: number }) {
  const { data, isLoading } = useMovers();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
      </div>
    );
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-2 lg:grid-cols-2">
      <Panel code="GAIN" title={`Top Gainers · ${data?.index ?? ""}`}>
        <MoverHeader />
        <div className="divide-y divide-border/60">
          {data?.gainers.slice(0, count).map((m) => (
            <MoverRow key={m.symbol} mover={m} />
          ))}
        </div>
      </Panel>
      <Panel code="LOSE" title={`Top Losers · ${data?.index ?? ""}`}>
        <MoverHeader />
        <div className="divide-y divide-border/60">
          {data?.losers.slice(0, count).map((m) => (
            <MoverRow key={m.symbol} mover={m} />
          ))}
        </div>
      </Panel>
    </div>
  );
}
