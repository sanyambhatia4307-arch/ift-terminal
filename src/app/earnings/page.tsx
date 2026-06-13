"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { CalendarClock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EarningsBriefBody } from "@/components/earnings/EarningsBrief";
import { PageHeader } from "@/components/shell/PageHeader";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { StatBand, StatTile } from "@/components/ui/stat-tile";
import { cn } from "@/lib/utils";
import type { EarningsEntry } from "@/app/api/earnings/route";

function useEarnings() {
  return useQuery({
    queryKey: ["earnings"],
    queryFn: async () => {
      const res = await axios.get<{ ok: boolean; data: EarningsEntry[] }>("/api/earnings");
      return res.data.data;
    },
    staleTime: 60 * 60 * 1000,
  });
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const weekKey = (iso: string) => {
  const d = new Date(iso);
  const days = Math.round((d.getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return "Today / Just reported";
  if (days <= 7) return "This week";
  if (days <= 14) return "Next week";
  if (days <= 31) return "This month";
  return "Later";
};

export default function EarningsPage() {
  const { data, isLoading } = useEarnings();
  const [expanded, setExpanded] = useState<string | null>(null);

  const groups = (data ?? []).reduce<Record<string, EarningsEntry[]>>((acc, e) => {
    const k = weekKey(e.start);
    (acc[k] ??= []).push(e);
    return acc;
  }, {});

  const now = Date.now();
  const weekCount = (data ?? []).filter(
    (e) => new Date(e.start).getTime() - now <= 7 * 86_400_000
  ).length;
  const confirmedCount = (data ?? []).filter((e) => e.confirmed).length;
  const nextUp = (data ?? [])[0];

  return (
    <div className="space-y-2 p-2">
      <PageHeader
        icon={CalendarClock}
        code="EARN"
        title="Earnings Calendar"
        subtitle="Upcoming results for the NIFTY 50 universe · windows firm up as dates are confirmed"
      />

      {data && data.length > 0 && (
        <StatBand cols={4}>
          <StatTile label="Upcoming" numeric={data.length} format={(n) => String(Math.round(n))} sub="NIFTY 50 results" tone="primary" />
          <StatTile label="This Week" numeric={weekCount} format={(n) => String(Math.round(n))} sub="reporting ≤7 days" tone={weekCount > 0 ? "bull" : "neutral"} />
          <StatTile label="Confirmed Dates" numeric={confirmedCount} format={(n) => String(Math.round(n))} sub={`${data.length - confirmedCount} tentative`} tone="neutral" />
          <StatTile label="Next Up" value={nextUp?.symbol ?? "n/a"} sub={nextUp ? fmtDate(nextUp.start).replace(/,.*/, "") : ""} tone="primary" />
        </StatBand>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <Panel code="EARN" title="No upcoming earnings windows">
          <div className="p-4 text-xs text-muted-foreground">
            No forward earnings dates are published right now · between result seasons this list
            can be empty. It refreshes every 12 hours.
          </div>
        </Panel>
      ) : (
        <div className="stagger space-y-2">
          {Object.entries(groups).map(([group, entries]) => (
            <Panel key={group} code="EARN" title={`${group} (${entries.length})`}>
              <div className="flex items-center gap-2 border-b border-border bg-secondary/20 px-2.5 py-1 text-[9px] uppercase tracking-wider text-muted-foreground">
                <span className="w-4" />
                <span className="w-28">Symbol</span>
                <span className="flex-1">Company · Sector</span>
                <span className="w-56 text-right">Earnings Window (IST)</span>
                <span className="w-24 text-right">Status</span>
                <span className="w-20 text-right">Research</span>
              </div>
              <div className="divide-y divide-border/60">
                {entries.map((e) => {
                  const isOpen = expanded === e.symbol;
                  return (
                    <div key={e.symbol}>
                      <button
                        onClick={() => setExpanded(isOpen ? null : e.symbol)}
                        className={cn(
                          "flex w-full cursor-pointer items-center gap-2 px-2.5 py-1.5 text-left text-[11px] transition-colors duration-150 hover:bg-accent/40",
                          isOpen && "bg-accent/40"
                        )}
                      >
                        <ChevronRight
                          className={cn(
                            "h-3 w-3 shrink-0 text-muted-foreground transition-transform",
                            isOpen && "rotate-90 text-primary"
                          )}
                        />
                        <span className="num w-28 font-medium text-primary">{e.symbol}</span>
                        <span className="flex-1 truncate text-muted-foreground">
                          {e.name} · {e.sector}
                        </span>
                        <span className="num w-56 text-right">
                          {fmtDate(e.start)}
                          {e.end && e.end !== e.start && ` to ${fmtDate(e.end)}`}
                        </span>
                        <span
                          className={cn(
                            "w-24 text-right text-[10px] uppercase",
                            e.confirmed ? "text-bull" : "text-muted-foreground"
                          )}
                        >
                          {e.confirmed ? "Confirmed" : "Tentative"}
                        </span>
                        <span className="w-20 text-right">
                          <Link
                            href={`/stock/${encodeURIComponent(e.symbol)}`}
                            onClick={(ev) => ev.stopPropagation()}
                            className="text-[10px] text-primary hover:underline"
                          >
                            Open →
                          </Link>
                        </span>
                      </button>
                      {isOpen && <EarningsBriefBody symbol={e.symbol} />}
                    </div>
                  );
                })}
              </div>
            </Panel>
          ))}
          <p className="px-1 text-[9px] text-muted-foreground">
            Results days bring outsized moves and rich option premiums · check the stock's
            Intelligence Score and volatility before holding through a print. Dates from company
            filings via Yahoo; tentative windows can shift.
          </p>
        </div>
      )}
    </div>
  );
}
