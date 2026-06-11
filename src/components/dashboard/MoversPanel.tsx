"use client";

import Link from "next/link";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useMovers } from "@/hooks/queries";
import { changeClass, fmt, fmtPct } from "@/lib/format";
import type { Mover } from "@/types/market";

function MoverRow({ mover }: { mover: Mover }) {
  return (
    <Link
      href={`/stock/${encodeURIComponent(mover.symbol)}`}
      className="flex items-center gap-2 px-2.5 py-[5px] text-xs transition-colors hover:bg-accent/40"
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
      <Panel title={`Top Gainers · ${data?.index ?? ""}`}>
        <div className="divide-y divide-border/60">
          {data?.gainers.slice(0, count).map((m) => (
            <MoverRow key={m.symbol} mover={m} />
          ))}
        </div>
      </Panel>
      <Panel title={`Top Losers · ${data?.index ?? ""}`}>
        <div className="divide-y divide-border/60">
          {data?.losers.slice(0, count).map((m) => (
            <MoverRow key={m.symbol} mover={m} />
          ))}
        </div>
      </Panel>
    </div>
  );
}
