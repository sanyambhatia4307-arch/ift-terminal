import { ManagementCommentary } from "@/components/earnings/EarningsBrief";
import { AnalysisPanel } from "@/components/stock/AnalysisPanel";
import { KeyStats } from "@/components/stock/KeyStats";
import { PeerComps } from "@/components/stock/PeerComps";
import { PriceChart } from "@/components/stock/PriceChart";
import { StockHeader } from "@/components/stock/StockHeader";
import { StockNews } from "@/components/stock/StockNews";

export default async function StockPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const symbol = decodeURIComponent((await params).symbol).toUpperCase();

  return (
    <div className="space-y-2 p-2">
      <StockHeader symbol={symbol} />
      <div className="grid grid-cols-1 items-stretch gap-2 xl:grid-cols-3">
        <div className="stagger flex min-h-0 flex-col gap-2 xl:col-span-2">
          <PriceChart symbol={symbol} />
          <PeerComps symbol={symbol} />
          <ManagementCommentary symbol={symbol} />
          <StockNews symbol={symbol} className="min-h-[180px] flex-1" scrollable />
        </div>
        <div className="stagger flex min-h-0 flex-col gap-2">
          <AnalysisPanel symbol={symbol} />
          <KeyStats symbol={symbol} className="flex-1" />
        </div>
      </div>
    </div>
  );
}
