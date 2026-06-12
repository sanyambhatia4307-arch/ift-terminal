"use client";

import { LayoutDashboard } from "lucide-react";
import { BreadthPanel } from "@/components/dashboard/BreadthPanel";
import { IndicesGrid } from "@/components/dashboard/IndicesGrid";
import { MarketPulse } from "@/components/dashboard/MarketPulse";
import { MoversPanel } from "@/components/dashboard/MoversPanel";
import { SectorPerformance } from "@/components/dashboard/SectorPerformance";
import { TopPicksPanel } from "@/components/dashboard/TopPicksPanel";
import { WatchlistStrip } from "@/components/dashboard/WatchlistStrip";
import { PageHeader } from "@/components/shell/PageHeader";
import { useMarketStatus } from "@/hooks/queries";

export default function DashboardPage() {
  const { data: status } = useMarketStatus();
  return (
    <div className="space-y-2 p-2">
      <PageHeader
        icon={LayoutDashboard}
        code="HOME"
        title="Market Overview"
        subtitle="Indices · flows · movers · breadth · news at a glance"
        right={
          status ? (
            <span className="num text-[10px] text-muted-foreground">
              {status.message}
            </span>
          ) : null
        }
      />
      <div className="grid grid-cols-1 items-stretch gap-2 xl:grid-cols-3">
        <div className="stagger flex flex-col gap-2 xl:col-span-2">
          <IndicesGrid />
          <WatchlistStrip />
          <MoversPanel />
          <TopPicksPanel />
        </div>
        {/* Right rail stretches to match the left column; the sector chart
            absorbs the remaining height so both rails end together. */}
        <div className="stagger flex min-h-0 flex-col gap-2">
          <MarketPulse />
          <BreadthPanel />
          <SectorPerformance className="min-h-[320px] flex-1" />
        </div>
      </div>
    </div>
  );
}
