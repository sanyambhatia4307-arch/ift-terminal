"use client";

import Link from "next/link";
import { useIndices } from "@/hooks/queries";
import { changeClass, fmt, fmtPct } from "@/lib/format";

export function TickerTape() {
  const { data } = useIndices();
  const items = data?.all?.slice(0, 24) ?? [];

  if (items.length === 0) {
    return <div className="h-8 shrink-0 border-b border-border bg-background" />;
  }

  // Duplicate the strip so the CSS loop is seamless.
  const strip = [...items, ...items];

  return (
    <div className="relative h-8 shrink-0 overflow-hidden border-b border-border bg-background">
      <div
        className="flex h-full w-max items-center gap-6 px-4"
        style={{ animation: "ticker-scroll 90s linear infinite" }}
      >
        {strip.map((idx, i) => (
          <Link
            key={`${idx.symbol}-${i}`}
            href={`/markets`}
            className="flex shrink-0 items-center gap-2 text-xs"
          >
            <span className="text-muted-foreground">{idx.symbol}</span>
            <span className="num">{fmt(idx.last)}</span>
            <span className={`num ${changeClass(idx.changePercent)}`}>
              {fmtPct(idx.changePercent)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
