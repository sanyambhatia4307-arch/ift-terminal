"use client";

import { useQueries } from "@tanstack/react-query";
import axios from "axios";
import { GitCompareArrows, Plus, X } from "lucide-react";
import { useState } from "react";
import { CompareChart, COMPARE_COLORS } from "@/components/compare/CompareChart";
import { PageHeader } from "@/components/shell/PageHeader";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuotes } from "@/hooks/queries";
import { changeClass, fmt, fmtInrCompact, fmtPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FundamentalsData, ChartResult } from "@/types/market";

async function getData<T>(url: string): Promise<T> {
  const res = await axios.get<{ ok: boolean; data: T }>(url);
  return res.data.data;
}

const DEFAULTS = ["TCS", "INFY"];

export default function ComparePage() {
  const [symbols, setSymbols] = useState<string[]>(DEFAULTS);
  const [input, setInput] = useState("");

  const { data: quotes } = useQuotes(symbols);

  const fundamentalsQueries = useQueries({
    queries: symbols.map((s) => ({
      queryKey: ["fundamentals", s],
      queryFn: () => getData<FundamentalsData>(`/api/fundamentals/${encodeURIComponent(s)}`),
      staleTime: 60 * 60 * 1000,
      retry: 0,
    })),
  });

  const chartQueries = useQueries({
    queries: symbols.map((s) => ({
      queryKey: ["chart", s, "1y", "1d"],
      queryFn: () => getData<ChartResult>(`/api/chart/${encodeURIComponent(s)}?range=1y&interval=1d`),
      staleTime: 10 * 60 * 1000,
      retry: 0,
    })),
  });

  const charts = symbols
    .map((symbol, i) => ({ symbol, data: chartQueries[i].data }))
    .filter((c): c is { symbol: string; data: ChartResult } => !!c.data);
  const chartsLoading = chartQueries.some((q) => q.isLoading);

  const addSymbol = () => {
    const s = input.trim().toUpperCase();
    if (s.length >= 2 && !symbols.includes(s) && symbols.length < 4) {
      setSymbols([...symbols, s]);
    }
    setInput("");
  };

  const METRICS: Array<[string, (f: FundamentalsData) => string]> = [
    ["Sector", (f) => f.sector ?? "—"],
    ["Market Cap", (f) => fmtInrCompact(f.marketCap)],
    ["P/E (TTM)", (f) => (f.trailingPE != null ? fmt(f.trailingPE) : "—")],
    ["P/B", (f) => (f.priceToBook != null ? fmt(f.priceToBook) : "—")],
    ["ROE", (f) => (f.returnOnEquity != null ? fmtPct(f.returnOnEquity * 100, false) : "—")],
    ["Net Margin", (f) => (f.profitMargin != null ? fmtPct(f.profitMargin * 100, false) : "—")],
    ["Revenue Growth", (f) => (f.revenueGrowth != null ? fmtPct(f.revenueGrowth * 100) : "—")],
    ["Debt/Equity", (f) => (f.debtToEquity != null ? fmt(f.debtToEquity / 100) : "—")],
    ["Dividend Yield", (f) => (f.dividendYield != null ? fmtPct(f.dividendYield, false) : "—")],
    ["Beta", (f) => (f.beta != null ? fmt(f.beta) : "—")],
    [
      "Street Target",
      (f) => (f.targetMeanPrice != null ? `₹${fmt(f.targetMeanPrice)}` : "—"),
    ],
    ["Consensus", (f) => f.recommendationKey?.replace(/_/g, " ").toUpperCase() ?? "—"],
  ];

  return (
    <div className="space-y-2 p-2">
      <PageHeader
        icon={GitCompareArrows}
        code="COMP"
        title="Compare"
        subtitle="Side-by-side fundamentals + 1Y relative performance (rebased to 100)"
      />

      <div className="flex flex-wrap items-center gap-2">
        {symbols.map((s, i) => (
          <span
            key={s}
            className="num flex items-center gap-1.5 rounded-sm border border-border bg-card px-2 py-1 text-xs"
            style={{ borderLeftColor: COMPARE_COLORS[i], borderLeftWidth: 3 }}
          >
            {s}
            <button
              onClick={() => setSymbols(symbols.filter((x) => x !== s))}
              className="cursor-pointer text-muted-foreground transition-colors hover:text-bear"
              aria-label={`Remove ${s}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {symbols.length < 4 && (
          <form
            className="flex items-center gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              addSymbol();
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Add NSE symbol…"
              className="h-7 w-40 text-xs"
            />
            <button
              type="submit"
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
              aria-label="Add symbol"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </form>
        )}
        <span className="text-[10px] text-muted-foreground">up to 4 symbols</span>
      </div>

      <div className="stagger grid grid-cols-1 gap-2 xl:grid-cols-2">
        <Panel code="PERF" title="1Y Relative Performance · rebased to 100">
          {chartsLoading && charts.length === 0 ? (
            <Skeleton className="m-2 h-[340px]" />
          ) : charts.length === 0 ? (
            <div className="flex h-[340px] items-center justify-center text-xs text-muted-foreground">
              Add symbols to compare.
            </div>
          ) : (
            <CompareChart charts={charts} />
          )}
        </Panel>

        <Panel code="FUND" title="Fundamentals · side by side">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border bg-secondary/20 text-[9px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-2.5 py-1.5 text-left font-semibold">Metric</th>
                  {symbols.map((s, i) => {
                    const q = quotes?.find((x) => x.symbol === s);
                    return (
                      <th key={s} className="px-2.5 py-1.5 text-right font-semibold">
                        <span style={{ color: COMPARE_COLORS[i] }}>{s}</span>
                        {q && (
                          <div className="num font-normal normal-case">
                            {fmt(q.last)}{" "}
                            <span className={changeClass(q.changePercent)}>
                              {fmtPct(q.changePercent)}
                            </span>
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {METRICS.map(([label, getter]) => (
                  <tr key={label}>
                    <td className="px-2.5 py-1.5 text-muted-foreground">{label}</td>
                    {symbols.map((s, i) => {
                      const fq = fundamentalsQueries[i];
                      return (
                        <td key={s} className="num px-2.5 py-1.5 text-right">
                          {fq.isLoading ? "…" : fq.data ? getter(fq.data) : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
      <p className="px-1 text-[9px] text-muted-foreground">
        Relative chart rebases each stock to 100 one year ago — the gap between lines is the
        out/under-performance. Fundamentals from latest reported financials (≤15-min quotes).
      </p>
    </div>
  );
}
