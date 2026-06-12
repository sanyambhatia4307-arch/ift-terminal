import { BreadthPanel } from "@/components/dashboard/BreadthPanel";
import { IndicesGrid } from "@/components/dashboard/IndicesGrid";
import { MarketPulse } from "@/components/dashboard/MarketPulse";
import { MoversPanel } from "@/components/dashboard/MoversPanel";
import { NewsPanel } from "@/components/dashboard/NewsPanel";
import { SectorPerformance } from "@/components/dashboard/SectorPerformance";
import { TopPicksPanel } from "@/components/dashboard/TopPicksPanel";
import { WatchlistStrip } from "@/components/dashboard/WatchlistStrip";

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 gap-2 p-2 xl:grid-cols-3">
      <div className="space-y-2 xl:col-span-2">
        <IndicesGrid />
        <WatchlistStrip />
        <MoversPanel />
        <TopPicksPanel />
        <BreadthPanel />
      </div>
      <div className="space-y-2">
        <MarketPulse />
        <SectorPerformance />
        <NewsPanel count={12} title="Breaking · Market News" />
      </div>
    </div>
  );
}
