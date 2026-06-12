"use client";

import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useFundamentals } from "@/hooks/queries";
import { fmt, fmtInrCompact, fmtPct } from "@/lib/format";
import type { FundamentalsData } from "@/types/market";

type Row = { label: string; value: string };

function rows(f: FundamentalsData): { valuation: Row[]; profitability: Row[]; balance: Row[]; ownership: Row[] } {
  const pct = (v?: number) => (v != null ? fmtPct(v * 100, false) : "—");
  return {
    valuation: [
      { label: "Market Cap", value: fmtInrCompact(f.marketCap) },
      { label: "P/E (TTM)", value: f.trailingPE != null ? fmt(f.trailingPE) : "—" },
      { label: "Forward P/E", value: f.forwardPE != null ? fmt(f.forwardPE) : "—" },
      { label: "P/B", value: f.priceToBook != null ? fmt(f.priceToBook) : "—" },
      { label: "EPS (TTM)", value: f.eps != null ? `₹${fmt(f.eps)}` : "—" },
      { label: "Book Value", value: f.bookValue != null ? `₹${fmt(f.bookValue)}` : "—" },
      { label: "Dividend Yield", value: f.dividendYield != null ? fmtPct(f.dividendYield, false) : "—" },
      { label: "Beta", value: f.beta != null ? fmt(f.beta) : "—" },
    ],
    profitability: [
      { label: "Revenue (TTM)", value: fmtInrCompact(f.totalRevenue) },
      { label: "Net Income", value: fmtInrCompact(f.netIncome) },
      { label: "Profit Margin", value: pct(f.profitMargin) },
      { label: "Operating Margin", value: pct(f.operatingMargin) },
      { label: "ROE", value: pct(f.returnOnEquity) },
      { label: "Revenue Growth", value: pct(f.revenueGrowth) },
      { label: "Earnings Growth", value: pct(f.earningsGrowth) },
    ],
    balance: [
      { label: "Total Cash", value: fmtInrCompact(f.totalCash) },
      { label: "Total Debt", value: fmtInrCompact(f.totalDebt) },
      { label: "Debt / Equity", value: f.debtToEquity != null ? fmt(f.debtToEquity / 100) : "—" },
      { label: "50D Average", value: f.fiftyDayAverage != null ? `₹${fmt(f.fiftyDayAverage)}` : "—" },
      { label: "200D Average", value: f.twoHundredDayAverage != null ? `₹${fmt(f.twoHundredDayAverage)}` : "—" },
    ],
    ownership: [
      { label: "Shares Outstanding", value: f.sharesOutstanding != null ? fmtInrCompact(f.sharesOutstanding).replace("₹", "") : "—" },
      { label: "Promoter/Insider", value: pct(f.heldByInsiders) },
      { label: "Institutions", value: pct(f.heldByInstitutions) },
      {
        label: "Analyst Target",
        value:
          f.targetMeanPrice != null
            ? `₹${fmt(f.targetMeanPrice)}${f.numberOfAnalysts ? ` (${f.numberOfAnalysts})` : ""}`
            : "—",
      },
      { label: "Consensus", value: f.recommendationKey?.replace(/_/g, " ").toUpperCase() ?? "—" },
    ],
  };
}

function StatBlock({ title, items }: { title: string; items: Row[] }) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-primary/80">
        {title}
      </div>
      <dl>
        {items.map((r) => (
          <div
            key={r.label}
            className="flex items-baseline justify-between gap-2 border-b border-border/40 py-[3px] text-[11px]"
          >
            <dt className="text-muted-foreground">{r.label}</dt>
            <dd className="num text-right">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function KeyStats({ symbol, className }: { symbol: string; className?: string }) {
  const { data: f, isLoading, isError } = useFundamentals(symbol);

  return (
    <Panel code="FUND" title="Fundamentals & Key Ratios" className={className ?? "h-full"}>
      {isLoading ? (
        <Skeleton className="m-2 h-72" />
      ) : isError || !f ? (
        <div className="p-3 text-xs text-muted-foreground">
          Fundamentals unavailable for this security.
        </div>
      ) : (
        <div className="space-y-3 p-2.5">
          {f.sector && (
            <div className="text-[11px] text-muted-foreground">
              <span className="text-foreground">{f.sector}</span> · {f.industry}
            </div>
          )}
          <div className="grid grid-cols-2 gap-x-5 gap-y-3">
            <StatBlock title="Valuation" items={rows(f).valuation} />
            <StatBlock title="Profitability" items={rows(f).profitability} />
            <StatBlock title="Balance Sheet" items={rows(f).balance} />
            <StatBlock title="Ownership & Street" items={rows(f).ownership} />
          </div>
          {f.quarterlyResults && f.quarterlyResults.length > 0 && (
            <div className="border-t border-border/60 pt-2">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-primary/80">
                Results Trend · last {f.quarterlyResults.length} quarters
              </div>
              <table className="num w-full text-[11px]">
                <thead>
                  <tr className="text-[9px] uppercase tracking-wider text-muted-foreground">
                    <th className="pb-0.5 text-left font-medium">Quarter</th>
                    <th className="pb-0.5 text-right font-medium">Revenue</th>
                    <th className="pb-0.5 text-right font-medium">Net Profit</th>
                    <th className="pb-0.5 text-right font-medium">Profit QoQ</th>
                  </tr>
                </thead>
                <tbody>
                  {f.quarterlyResults.map((q, i, arr) => {
                    const prev = arr[i - 1];
                    const qoq =
                      prev?.earnings && q.earnings !== undefined
                        ? ((q.earnings - prev.earnings) / Math.abs(prev.earnings)) * 100
                        : undefined;
                    return (
                      <tr key={q.period} className="border-t border-border/40">
                        <td className="py-[3px]">{q.period}</td>
                        <td className="py-[3px] text-right">{fmtInrCompact(q.revenue)}</td>
                        <td className="py-[3px] text-right">{fmtInrCompact(q.earnings)}</td>
                        <td
                          className={`py-[3px] text-right ${
                            qoq === undefined ? "text-muted-foreground" : qoq >= 0 ? "text-bull" : "text-bear"
                          }`}
                        >
                          {qoq !== undefined ? fmtPct(qoq) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {f.summary && (
            <p className="line-clamp-4 border-t border-border/60 pt-2 text-[11px] leading-relaxed text-muted-foreground">
              {f.summary}
            </p>
          )}
        </div>
      )}
    </Panel>
  );
}
