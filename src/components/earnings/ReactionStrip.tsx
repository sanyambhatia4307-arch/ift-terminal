"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ReactionsResult } from "@/lib/analysis/reactions";

function useReactions(symbol: string, enabled = true) {
  return useQuery({
    queryKey: ["reactions", symbol],
    queryFn: async () => {
      const res = await axios.get<{ ok: boolean; data: ReactionsResult }>(
        `/api/reactions/${encodeURIComponent(symbol)}`
      );
      return res.data.data;
    },
    enabled,
    staleTime: 12 * 60 * 60 * 1000,
    retry: 0,
  });
}

const fmtMonth = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });

/** How the stock moved across each of its recent earnings prints. */
export function ReactionStrip({ symbol }: { symbol: string }) {
  const { data, isLoading } = useReactions(symbol);

  if (isLoading) return <Skeleton className="m-2 h-16" />;
  if (!data || data.reactions.length === 0) return null;

  const maxAbs = Math.max(...data.reactions.map((r) => Math.abs(r.reactionPct)), 1);
  const oldestFirst = [...data.reactions].reverse();

  return (
    <div className="px-3 py-2">
      <div className="mb-1 flex flex-wrap items-baseline gap-x-4 gap-y-0.5">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-primary">
          Results Reactions · last {data.reactions.length} prints
        </span>
        {data.stats && (
          <span className="num text-[10px] text-muted-foreground">
            avg{" "}
            <span className={data.stats.avgPct >= 0 ? "text-bull" : "text-bear"}>
              {data.stats.avgPct >= 0 ? "+" : ""}
              {data.stats.avgPct}%
            </span>{" "}
            · positive {Math.round(data.stats.positiveRate * 100)}% · typical swing ±
            {data.stats.avgAbsPct}% · range {data.stats.worstPct}% → +{data.stats.bestPct}%
          </span>
        )}
      </div>

      <div className="flex items-end gap-1.5">
        {oldestFirst.map((r) => {
          const h = Math.max(4, (Math.abs(r.reactionPct) / maxAbs) * 36);
          const up = r.reactionPct >= 0;
          return (
            <div
              key={r.date}
              className="group flex flex-col items-center"
              title={`${r.date}: ${up ? "+" : ""}${r.reactionPct}% across the print (₹${r.prevClose} → ₹${r.postClose})`}
            >
              <span
                className={cn("num text-[8.5px] leading-none", up ? "text-bull" : "text-bear")}
              >
                {up ? "+" : ""}
                {r.reactionPct}
              </span>
              <div className="mt-0.5 flex h-9 w-7 items-end justify-center rounded-sm bg-secondary/50">
                <div
                  className={cn("w-3.5 rounded-t-sm", up ? "bg-bull" : "bg-bear")}
                  style={{ height: `${h}px`, opacity: 0.85 }}
                />
              </div>
              <span className="mt-0.5 text-[8px] text-muted-foreground">{fmtMonth(r.date)}</span>
            </div>
          );
        })}

        {data.surprises.length > 0 && (
          <div className="num ml-3 border-l border-border/60 pl-3 text-[9.5px] leading-relaxed text-muted-foreground">
            <div className="text-[8.5px] font-semibold uppercase tracking-widest text-primary/80">
              EPS vs estimate
            </div>
            {data.surprises.slice(0, 4).map((s) => (
              <div key={s.quarter}>
                {s.quarter.slice(0, 7)}: {s.epsActual ?? "—"} vs {s.epsEstimate ?? "—"}{" "}
                {s.surprisePercent !== undefined && (
                  <span className={s.surprisePercent >= 0 ? "text-bull" : "text-bear"}>
                    ({s.surprisePercent >= 0 ? "beat +" : "miss "}
                    {s.surprisePercent.toFixed(1)}%)
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
