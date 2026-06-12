"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { fmt, fmtInrCompact, fmtVolume } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LargeDeal } from "@/lib/sources/nse";

function useDeals() {
  return useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      const res = await axios.get<{ ok: boolean; data: { asOn: string; deals: LargeDeal[] } }>(
        "/api/deals"
      );
      return res.data.data;
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });
}

export function DealsPanel() {
  const { data, isLoading } = useDeals();

  return (
    <Panel
      code="DEAL"
      title="Bulk & Block Deals · NSE"
      right={
        data ? (
          <span className="num text-[10px] text-muted-foreground">as on {data.asOn}</span>
        ) : null
      }
    >
      {isLoading ? (
        <Skeleton className="m-2 h-48" />
      ) : !data || data.deals.length === 0 ? (
        <div className="p-3 text-xs text-muted-foreground">
          No bulk/block deals reported yet today — NSE publishes them during and after market
          hours.
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 border-b border-border bg-secondary/20 px-2.5 py-1 text-[9px] uppercase tracking-wider text-muted-foreground">
            <span className="w-12">Type</span>
            <span className="w-24">Symbol</span>
            <span className="flex-1">Client</span>
            <span className="w-10">Side</span>
            <span className="w-16 text-right">Qty</span>
            <span className="w-16 text-right">Price</span>
            <span className="w-20 text-right">Value</span>
          </div>
          <div className="max-h-72 divide-y divide-border/60 overflow-y-auto">
            {data.deals.slice(0, 40).map((d, i) => (
              <div key={i} className="flex items-center gap-2 px-2.5 py-1 text-[11px]">
                <span
                  className={cn(
                    "num w-12 rounded-[2px] px-1 text-center text-[9px]",
                    d.type === "BLOCK"
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {d.type}
                </span>
                <Link
                  href={`/stock/${encodeURIComponent(d.symbol)}`}
                  className="num w-24 truncate font-medium text-primary hover:underline"
                >
                  {d.symbol}
                </Link>
                <span className="flex-1 truncate text-[10px] text-muted-foreground" title={d.clientName}>
                  {d.clientName}
                </span>
                <span className={cn("w-10 font-semibold", d.buySell === "BUY" ? "text-bull" : "text-bear")}>
                  {d.buySell}
                </span>
                <span className="num w-16 text-right">{fmtVolume(d.qty)}</span>
                <span className="num w-16 text-right">{fmt(d.price)}</span>
                <span className="num w-20 text-right text-muted-foreground">
                  {fmtInrCompact(d.qty * d.price)}
                </span>
              </div>
            ))}
          </div>
          <div className="px-2.5 py-1 text-[9px] text-muted-foreground">
            Block = negotiated window trades · Bulk = &gt;0.5% of equity in a day. Big
            institutional prints often precede multi-week moves.
          </div>
        </>
      )}
    </Panel>
  );
}
