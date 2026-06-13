"use client";

import { X } from "lucide-react";
import { NewsPanel } from "@/components/dashboard/NewsPanel";
import { AnalysisPanel } from "@/components/stock/AnalysisPanel";
import { PriceChart } from "@/components/stock/PriceChart";
import { FlashValue } from "@/components/ui/flash";
import { useQuote } from "@/hooks/queries";
import { changeClass, fmt, fmtPct } from "@/lib/format";

export interface CommoditySelection {
  symbol: string; // research/Yahoo symbol (e.g. GC=F, GOLDBEES, INR=X)
  label: string;
  inrText?: string; // pre-formatted ₹ value, e.g. "₹1,02,340 /10g"
  newsQuery: string;
}

export function CommodityDetail({
  sel,
  onClose,
}: {
  sel: CommoditySelection;
  onClose: () => void;
}) {
  const { data: q } = useQuote(sel.symbol);

  return (
    <div className="panel-rise space-y-2 rounded-sm border border-primary/40 bg-card/60 p-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1">
        <h2 className="text-sm font-semibold">{sel.label}</h2>
        {q && (
          <span className="num text-sm">
            <FlashValue value={q.last}>{fmt(q.last)}</FlashValue>{" "}
            <span className={changeClass(q.changePercent)}>
              {q.change > 0 ? "+" : ""}
              {fmt(q.change)} ({fmtPct(q.changePercent)})
            </span>
          </span>
        )}
        {sel.inrText && (
          <span className="num rounded-sm border border-border bg-secondary/40 px-1.5 py-0.5 text-[11px] text-primary">
            {sel.inrText}
          </span>
        )}
        <button
          onClick={onClose}
          className="ml-auto flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-bear"
          aria-label="Close detail"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-2 xl:grid-cols-3">
        <div className="flex min-h-0 flex-col gap-2 xl:col-span-2">
          <PriceChart symbol={sel.symbol} />
          <NewsPanel
            query={sel.newsQuery}
            count={10}
            title={`News · ${sel.label}`}
            className="min-h-[160px] flex-1"
            scrollable
          />
        </div>
        <AnalysisPanel symbol={sel.symbol} />
      </div>
    </div>
  );
}
