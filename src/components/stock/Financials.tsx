"use client";

import { BarChart3 } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useFinancials } from "@/hooks/queries";
import { cn } from "@/lib/utils";
import type { FinancialYear } from "@/types/market";

const cr = (n?: number) =>
  n == null ? "—" : (n / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const pc = (n?: number) => (n == null ? "—" : `${n.toFixed(1)}%`);

const ROWS: Array<{
  label: string;
  key: keyof FinancialYear;
  kind: "cr" | "pct";
  emphasis?: boolean;
}> = [
  { label: "Revenue", key: "revenue", kind: "cr" },
  { label: "EBIT", key: "ebit", kind: "cr" },
  { label: "Net income", key: "netIncome", kind: "cr" },
  { label: "EBIT margin", key: "ebitMargin", kind: "pct" },
  { label: "Net margin", key: "netMargin", kind: "pct" },
  { label: "ROCE", key: "roce", kind: "pct", emphasis: true },
  { label: "Free cash flow", key: "fcf", kind: "cr" },
  { label: "Cash conversion", key: "cashConversion", kind: "pct" },
];

function roceClass(v?: number): string {
  if (v == null) return "text-muted-foreground/60";
  if (v >= 20) return "text-bull";
  if (v >= 12) return "text-primary";
  return "text-bear";
}

function Chip({ label, value, tone }: { label: string; value: string; tone?: "bull" | "bear" | "neutral" }) {
  const color = tone === "bull" ? "text-bull" : tone === "bear" ? "text-bear" : "text-foreground";
  return (
    <div className="rounded-sm border border-border bg-background/40 px-2 py-1">
      <div className="text-[8.5px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("num text-sm font-semibold leading-tight", color)}>{value}</div>
    </div>
  );
}

export function Financials({ symbol }: { symbol: string }) {
  const { data, isLoading, isError } = useFinancials(symbol);
  const years = data?.years ?? [];

  return (
    <Panel
      code="FIN"
      title={
        <span className="flex items-center gap-1.5">
          <BarChart3 className="h-3 w-3" /> Financials
          <span className="text-muted-foreground">· ₹ Cr, last {years.length || ""} years</span>
        </span>
      }
    >
      {isLoading ? (
        <Skeleton className="m-2 h-48" />
      ) : isError || years.length === 0 ? (
        <div className="p-4 text-xs text-muted-foreground">
          Financial statements unavailable for this name.
        </div>
      ) : (
        <div className="space-y-2 p-2.5">
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            <Chip
              label="ROCE (latest)"
              value={pc(data?.latestRoce)}
              tone={data?.latestRoce != null ? (data.latestRoce >= 15 ? "bull" : data.latestRoce >= 8 ? "neutral" : "bear") : "neutral"}
            />
            <Chip
              label="Revenue CAGR"
              value={data?.revenueCagr != null ? `${data.revenueCagr >= 0 ? "+" : ""}${data.revenueCagr.toFixed(1)}%` : "—"}
              tone={data?.revenueCagr != null ? (data.revenueCagr >= 0 ? "bull" : "bear") : "neutral"}
            />
            <Chip label="Free cash flow" value={`₹${cr(data?.latestFcf)} Cr`} tone={data?.latestFcf != null ? (data.latestFcf >= 0 ? "bull" : "bear") : "neutral"} />
            <Chip
              label="Cash conversion"
              value={pc(data?.latestCashConversion)}
              tone={data?.latestCashConversion != null ? (data.latestCashConversion >= 60 ? "bull" : "neutral") : "neutral"}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border text-[9px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-1 pr-2 text-left font-medium">Metric</th>
                  {years.map((y) => (
                    <th key={y.date} className="num py-1 pl-2 text-right font-medium">
                      {y.fy}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {ROWS.map((row) => (
                  <tr key={row.label} className={cn(row.emphasis && "bg-primary/5")}>
                    <td className="py-1 pr-2 text-left text-muted-foreground">{row.label}</td>
                    {years.map((y) => {
                      const v = y[row.key] as number | undefined;
                      const text = row.kind === "cr" ? cr(v) : pc(v);
                      const cls =
                        row.key === "roce"
                          ? roceClass(v)
                          : (row.key === "fcf" || row.key === "netIncome") && v != null && v < 0
                            ? "text-bear"
                            : "text-foreground/90";
                      return (
                        <td key={y.date} className={cn("num py-1 pl-2 text-right", cls, row.emphasis && "font-semibold")}>
                          {text}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[9px] leading-snug text-muted-foreground">
            ROCE = EBIT ÷ (total assets − current liabilities). Cash conversion = free cash flow ÷ net
            income. Annual consolidated figures via Yahoo fundamentalsTimeSeries.
          </p>
        </div>
      )}
    </Panel>
  );
}
