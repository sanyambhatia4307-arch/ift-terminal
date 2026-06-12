"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Coins } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shell/PageHeader";
import { FlashValue } from "@/components/ui/flash";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { changeClass, fmt, fmtPct } from "@/lib/format";
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
  Context: "FX",
};

function GroupPanel({ g }: { g: CommodityGroup }) {
  return (
    <Panel code={CODES[g.group] ?? "CMDT"} title={g.group}>
      <div className="flex items-center gap-2 border-b border-border bg-secondary/20 px-2.5 py-1 text-[9px] uppercase tracking-wider text-muted-foreground">
        <span className="flex-1">Instrument</span>
        <span className="w-24 text-right">Last</span>
        <span className="w-16 text-right">Chg %</span>
        <span className="w-28 text-right">Day Range</span>
        <span className="w-20 text-right">Unit</span>
      </div>
      <div className="divide-y divide-border/60">
        {g.rows.map((row) => {
          const content = (
            <>
              <span className="flex-1 truncate text-xs font-medium">
                {row.label}
                {row.appSymbol && (
                  <span className="num ml-1.5 text-[10px] text-primary">{row.appSymbol} →</span>
                )}
              </span>
              <span className="num w-24 text-right text-xs">
                <FlashValue value={row.last}>{fmt(row.last)}</FlashValue>
              </span>
              <span className={`num w-16 text-right text-xs ${changeClass(row.changePercent)}`}>
                {fmtPct(row.changePercent)}
              </span>
              <span className="num w-28 text-right text-[11px] text-muted-foreground">
                {fmt(row.low)} – {fmt(row.high)}
              </span>
              <span className="num w-20 text-right text-[10px] text-muted-foreground">
                {row.unit}
              </span>
            </>
          );
          return row.appSymbol ? (
            <Link
              key={row.symbol}
              href={`/stock/${encodeURIComponent(row.appSymbol)}`}
              className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5 transition-colors duration-150 hover:bg-accent/40"
            >
              {content}
            </Link>
          ) : (
            <div key={row.symbol} className="flex items-center gap-2 px-2.5 py-1.5">
              {content}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

export default function CommoditiesPage() {
  const { data, isLoading } = useCommodities();

  return (
    <div className="space-y-2 p-2">
      <PageHeader
        icon={Coins}
        code="CMDT"
        title="Commodities"
        subtitle="Global futures · Indian gold & silver ETFs · 60s refresh"
      />
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="stagger grid grid-cols-1 gap-2 lg:grid-cols-2">
          {data?.map((g) => <GroupPanel key={g.group} g={g} />)}
        </div>
      )}
      <p className="px-1 text-[9px] leading-snug text-muted-foreground">
        Global futures are front-month contracts in USD (delayed). India ETF rows open the full
        research view — chart, signal engine and news — like any stock. Commodity mutual funds
        (fund-of-funds) track these same ETFs with a 1-day NAV lag.
      </p>
    </div>
  );
}
