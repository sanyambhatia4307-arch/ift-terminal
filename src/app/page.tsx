"use client";

import { DashboardMasthead } from "@/components/dashboard/DashboardMasthead";
import { Heatmap } from "@/components/dashboard/Heatmap";
import { IndicesGrid } from "@/components/dashboard/IndicesGrid";
import { MarketMoodBand } from "@/components/dashboard/MarketMoodBand";
import { MarketPulse } from "@/components/dashboard/MarketPulse";
import { MoversPanel } from "@/components/dashboard/MoversPanel";
import { SectorPerformance } from "@/components/dashboard/SectorPerformance";
import { TopPicksPanel } from "@/components/dashboard/TopPicksPanel";
import { WatchlistStrip } from "@/components/dashboard/WatchlistStrip";

export default function DashboardPage() {
  return (
    <div className="space-y-2.5 p-2.5">
      <DashboardMasthead />
      {/* Hero: live mood, breadth gauge, macro chips */}
      <MarketMoodBand />
      <WatchlistStrip />

      <div className="grid grid-cols-1 items-stretch gap-2 xl:grid-cols-3">
        <div className="stagger flex flex-col gap-2 xl:col-span-2">
          <IndicesGrid />
          <Heatmap />
          <MoversPanel />
          <TopPicksPanel />
        </div>
        {/* Right rail; sector bars absorb remaining height so rails align */}
        <div className="stagger flex min-h-0 flex-col gap-2">
          <MarketPulse />
          <SectorPerformance className="min-h-[320px] flex-1" />
        </div>
      </div>
    </div>
  );
}
