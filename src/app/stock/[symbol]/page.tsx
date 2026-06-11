import { AnalysisPanel } from "@/components/stock/AnalysisPanel";
import { KeyStats } from "@/components/stock/KeyStats";
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
      <div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
        <div className="space-y-2 xl:col-span-2">
          <PriceChart symbol={symbol} />
          <StockNews symbol={symbol} />
        </div>
        <div className="space-y-2">
          <AnalysisPanel symbol={symbol} />
          <KeyStats symbol={symbol} />
        </div>
      </div>
    </div>
  );
}
