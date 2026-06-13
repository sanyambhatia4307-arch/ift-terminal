"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ChevronRight, Coins } from "lucide-react";
import { useState } from "react";
import { CommodityDetail, type CommoditySelection } from "@/components/commodities/CommodityDetail";
import { PageHeader } from "@/components/shell/PageHeader";
import { FlashValue } from "@/components/ui/flash";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { StatBand, StatTile } from "@/components/ui/stat-tile";
import { changeClass, fmt, fmtPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CommodityRow } from "@/app/api/commodities/route";

interface CommodityGroup {
  group: string;
  rows: CommodityRow[];
}

function useCommodities() {
  return useQuery({
    queryKey: ["commodities"],
    queryFn: async () => {
      const res = await axios.get<{ ok: boolean; data: CommodityGroup[] }>("/api/commodities");
      return res.data.data;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

const CODES: Record<string, string> = {
  "Precious Metals (Global)": "PREC",
  Energy: "ENRG",
  "Base Metals": "BASE",
  "India ETFs (₹ · trade like stocks)": "ETF",
  Currency: "FX",
};

// Indian compact ₹ (lakh-aware) with the per-unit suffix from inrUnit.
function inrCompact(n: number, inrUnit: string): string {
  const suffix = inrUnit.replace(/^₹/, "").trim(); // "/10g" · "/kg" · "per $1"
  const value =
    Math.abs(n) >= 1e5
      ? `₹${(n / 1e5).toLocaleString("en-IN", { maximumFractionDigits: 2 })} L`
      : `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  return suffix ? `${value} ${suffix}` : value;
}

function researchSymbolFor(row: CommodityRow): string {
  return row.appSymbol ?? row.symbol;
}

function GroupPanel({
  g,
  selectedSymbol,
  onSelect,
}: {
  g: CommodityGroup;
  selectedSymbol: string | null;
  onSelect: (sel: CommoditySelection) => void;
}) {
  return (
    <Panel code={CODES[g.group] ?? "CMDT"} title={g.group}>
      <div className="flex items-center gap-2 border-b border-border bg-secondary/20 px-2.5 py-1 text-[9px] uppercase tracking-wider text-muted-foreground">
        <span className="w-4" />
        <span className="flex-1">Instrument</span>
        <span className="w-28 text-right">Value (₹)</span>
        <span className="w-20 text-right">Native</span>
        <span className="w-14 text-right">Chg %</span>
      </div>
      <div className="divide-y divide-border/60">
        {g.rows.map((row) => {
          const rsym = researchSymbolFor(row);
          const active = selectedSymbol === rsym;
          const inrText =
            row.inrValue !== undefined ? inrCompact(row.inrValue, row.inrUnit) : "n/a";
          return (
            <button
              key={row.symbol}
              onClick={() =>
                onSelect({
                  symbol: rsym,
                  label: row.label,
                  inrText: row.inrValue !== undefined ? inrText : undefined,
                  newsQuery: `${row.label.replace(/\s*\(.*\)/, "")} price India`,
                })
              }
              className={cn(
                "flex w-full cursor-pointer items-center gap-2 px-2.5 py-1.5 text-left transition-colors duration-150 hover:bg-accent/40",
                active && "bg-accent/50"
              )}
            >
              <ChevronRight
                className={cn(
                  "h-3 w-3 shrink-0 text-muted-foreground transition-transform",
                  active && "rotate-90 text-primary"
                )}
              />
              <span className="flex-1 truncate text-xs font-medium">{row.label}</span>
              <span className="num w-28 text-right text-xs">
                <FlashValue value={row.inrValue}>{inrText}</FlashValue>
              </span>
              <span className="num w-20 text-right text-[10px] text-muted-foreground">
                {fmt(row.last)}
                <span className="ml-0.5">{row.unit.replace("₹/unit", "").replace("₹", "")}</span>
              </span>
              <span className={`num w-14 text-right text-xs ${changeClass(row.changePercent)}`}>
                {fmtPct(row.changePercent)}
              </span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

function CommodityStatHero({ data }: { data: CommodityGroup[] }) {
  const all = data.flatMap((g) => g.rows);
  const find = (sym: string) => all.find((r) => r.symbol === sym);
  const cards: Array<{ label: string; row?: CommodityRow }> = [
    { label: "Gold", row: find("GC=F") },
    { label: "Silver", row: find("SI=F") },
    { label: "Brent Crude", row: find("BZ=F") },
    { label: "USD / INR", row: find("INR=X") },
  ];
  return (
    <StatBand cols={4}>
      {cards.map(({ label, row }) => (
        <StatTile
          key={label}
          label={label}
          numeric={row?.inrValue ?? row?.last ?? 0}
          format={(n) =>
            label === "USD / INR"
              ? `₹${n.toFixed(2)}`
              : `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
          }
          sub={
            row ? (
              <span>
                {row.inrUnit.replace(/^₹\/?/, "/")} · {fmtPct(row.changePercent)}
              </span>
            ) : (
              ""
            )
          }
          tone={row && row.changePercent >= 0 ? "bull" : "bear"}
        />
      ))}
    </StatBand>
  );
}

export default function CommoditiesPage() {
  const { data, isLoading } = useCommodities();
  const [sel, setSel] = useState<CommoditySelection | null>(null);

  return (
    <div className="space-y-2 p-2">
      <PageHeader
        icon={Coins}
        code="CMDT"
        title="Commodities"
        subtitle="₹-converted prices · click any row for full research · 60s refresh"
      />

      {data && <CommodityStatHero data={data} />}

      {sel && <CommodityDetail sel={sel} onClose={() => setSel(null)} />}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="stagger grid grid-cols-1 gap-2 lg:grid-cols-2">
          {data?.map((g) => (
            <GroupPanel key={g.group} g={g} selectedSymbol={sel?.symbol ?? null} onSelect={setSel} />
          ))}
        </div>
      )}
      <p className="px-1 text-[9px] leading-snug text-muted-foreground">
        ₹ values convert live global futures (USD) at the current USD/INR rate into Indian market
        units · gold &amp; platinum per 10g, silver &amp; copper per kg, crude per barrel. Click any
        row to open its chart, intelligence score (technical + AI sentiment) and news · global
        commodities have no company fundamentals, so those pillars show as unavailable. India ETFs
        track these metals and trade like stocks; commodity mutual funds (fund-of-funds) follow the
        same ETFs with a 1-day NAV lag.
      </p>
    </div>
  );
}
