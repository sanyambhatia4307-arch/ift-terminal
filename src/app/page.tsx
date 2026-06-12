"use client";

import { LayoutDashboard } from "lucide-react";
import { BreadthPanel } from "@/components/dashboard/BreadthPanel";
import { IndicesGrid } from "@/components/dashboard/IndicesGrid";
import { MarketPulse } from "@/components/dashboard/MarketPulse";
import { MoversPanel } from "@/components/dashboard/MoversPanel";
import { NewsPanel } from "@/components/dashboard/NewsPanel";
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
      <div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
        <div className="space-y-2 xl:col-span-2">
          <IndicesGrid />
          <WatchlistStrip />
          <MoversPanel />
          <TopPicksPanel />
        </div>
        <div className="space-y-2">
          <MarketPulse />
          <NewsPanel count={8} title="Breaking · Market News" />
          <BreadthPanel />
          <SectorPerformance />
        </div>
      </div>
    </div>
  );
}
