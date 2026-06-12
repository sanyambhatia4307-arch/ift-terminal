"use client";

import { FlashValue } from "@/components/ui/flash";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useIndices } from "@/hooks/queries";
import { changeClass, fmt, fmtPct } from "@/lib/format";
import { cn } from "@/lib/utils";

export function IndicesGrid() {
  const { data, isLoading, dataUpdatedAt } = useIndices();

  return (
    <Panel
      code="IDX"
      title="Major Indices"
      right={
        dataUpdatedAt ? (
          <span className="num text-[10px] text-muted-foreground">
            {new Date(dataUpdatedAt).toLocaleTimeString("en-IN", { hour12: false })} ·{" "}
            {data?.source?.toUpperCase()}
          </span>
        ) : null
      }
    >
      {isLoading ? (
        <div className="grid grid-cols-4 gap-px p-px">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-none" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-4">
          {data?.headline.map((idx) => (
            <div key={idx.symbol} className="bg-card px-2.5 py-2">
              <div className="truncate text-[11px] text-muted-foreground">{idx.name}</div>
              <div className="num mt-0.5 text-base font-medium leading-tight">
                <FlashValue value={idx.last}>{fmt(idx.last)}</FlashValue>
              </div>
              <div className={cn("num text-xs", changeClass(idx.change))}>
                {idx.change > 0 ? "+" : ""}
                {fmt(idx.change)} ({fmtPct(idx.changePercent)})
              </div>
              {idx.pe ? (
                <div className="num mt-0.5 text-[10px] text-muted-foreground">
                  P/E {idx.pe.toFixed(1)} · P/B {idx.pb?.toFixed(1) ?? "—"} · Yld{" "}
                  {idx.divYield?.toFixed(2) ?? "—"}%
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
