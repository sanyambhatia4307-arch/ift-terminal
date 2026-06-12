"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ChevronRight, Globe2 } from "lucide-react";
import Link from "next/link";
import { Fragment, useState } from "react";
import { MoversPanel } from "@/components/dashboard/MoversPanel";
import { DealsPanel } from "@/components/markets/DealsPanel";
import { PageHeader } from "@/components/shell/PageHeader";
import { SectorPerformance } from "@/components/dashboard/SectorPerformance";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIndices } from "@/hooks/queries";
import { INDEX_CONSTITUENTS } from "@/lib/data/constituents";
import { changeClass, fmt, fmtPct, fmtVolume } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StockQuote } from "@/types/market";

interface ConstituentsPayload {
  index: string;
  supported: boolean;
  stocks: StockQuote[];
}

function useConstituents(index: string, enabled: boolean) {
  return useQuery({
    queryKey: ["constituents", index],
    queryFn: async () => {
      const res = await axios.get<{ ok: boolean; data: ConstituentsPayload }>(
        `/api/constituents?index=${encodeURIComponent(index)}`
      );
      return res.data.data;
    },
    enabled,
    staleTime: 60_000,
    refetchInterval: enabled ? 60_000 : false,
  });
}

function ConstituentsTable({ index }: { index: string }) {
  const { data, isLoading } = useConstituents(index, true);

  if (isLoading) {
    return (
      <div className="space-y-1 p-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-6" />
        ))}
      </div>
    );
  }
  if (!data?.supported || data.stocks.length === 0) {
    return (
      <div className="p-3 text-[11px] text-muted-foreground">
        Constituent data is not tracked for this index yet.
      </div>
    );
  }
  return (
    <div className="border-l-2 border-primary/40 bg-background/60">
      <Table>
        <TableHeader>
          <TableRow className="text-[10px] uppercase tracking-wider">
            <TableHead className="h-6 pl-6">Stock</TableHead>
            <TableHead className="h-6">Name</TableHead>
            <TableHead className="h-6 text-right">Last</TableHead>
            <TableHead className="h-6 text-right">Chg%</TableHead>
            <TableHead className="h-6 text-right">Day Range</TableHead>
            <TableHead className="h-6 text-right">52W Range</TableHead>
            <TableHead className="h-6 text-right">Volume</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.stocks.map((q) => (
            <TableRow key={q.symbol} className="text-[11px]">
              <TableCell className="num py-1 pl-6 font-medium">
                <Link
                  href={`/stock/${encodeURIComponent(q.symbol)}`}
                  className="text-primary hover:underline"
                >
                  {q.symbol}
                </Link>
              </TableCell>
              <TableCell className="max-w-44 truncate py-1 text-muted-foreground">
                {q.name}
              </TableCell>
              <TableCell className="num py-1 text-right">{fmt(q.last)}</TableCell>
              <TableCell className={`num py-1 text-right ${changeClass(q.changePercent)}`}>
                {fmtPct(q.changePercent)}
              </TableCell>
              <TableCell className="num py-1 text-right text-muted-foreground">
                {fmt(q.low)} – {fmt(q.high)}
              </TableCell>
              <TableCell className="num py-1 text-right text-muted-foreground">
                {fmt(q.yearLow)} – {fmt(q.yearHigh)}
              </TableCell>
              <TableCell className="num py-1 text-right text-muted-foreground">
                {fmtVolume(q.volume)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="px-6 pb-2 text-[9px] text-muted-foreground">
        Tracked constituents ({data.stocks.length}) — live index membership may differ.
      </div>
    </div>
  );
}

function AllIndicesTable() {
  const { data, isLoading } = useIndices();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) return <Skeleton className="h-96" />;

  return (
    <Panel
      code="ALLX"
      title={`All Indices (${data?.all.length ?? 0})`}
      right={
        <span className="text-[10px] text-muted-foreground">
          Click an index to view its constituents
        </span>
      }
    >
      <div className="max-h-[70vh] overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow className="text-[10px] uppercase tracking-wider">
              <TableHead className="h-7 w-6" />
              <TableHead className="h-7">Index</TableHead>
              <TableHead className="h-7 text-right">Last</TableHead>
              <TableHead className="h-7 text-right">Chg%</TableHead>
              <TableHead className="h-7 text-right">Open</TableHead>
              <TableHead className="h-7 text-right">High</TableHead>
              <TableHead className="h-7 text-right">Low</TableHead>
              <TableHead className="h-7 text-right">52W High</TableHead>
              <TableHead className="h-7 text-right">52W Low</TableHead>
              <TableHead className="h-7 text-right">P/E</TableHead>
              <TableHead className="h-7 text-right">P/B</TableHead>
              <TableHead className="h-7 text-right">Div Yld</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.all.map((idx) => {
              const isOpen = expanded === idx.name;
              const hasConstituents = !!INDEX_CONSTITUENTS[idx.name.toUpperCase()];
              return (
                <Fragment key={idx.symbol}>
                  <TableRow
                    className={cn(
                      "cursor-pointer text-xs",
                      isOpen && "bg-accent/40"
                    )}
                    onClick={() => setExpanded(isOpen ? null : idx.name)}
                  >
                    <TableCell className="py-1 pr-0">
                      <ChevronRight
                        className={cn(
                          "h-3 w-3 transition-transform",
                          isOpen && "rotate-90 text-primary",
                          !hasConstituents && "opacity-20"
                        )}
                      />
                    </TableCell>
                    <TableCell className="py-1 font-medium">{idx.name}</TableCell>
                    <TableCell className="num py-1 text-right">{fmt(idx.last)}</TableCell>
                    <TableCell className={`num py-1 text-right ${changeClass(idx.changePercent)}`}>
                      {fmtPct(idx.changePercent)}
                    </TableCell>
                    <TableCell className="num py-1 text-right text-muted-foreground">{fmt(idx.open)}</TableCell>
                    <TableCell className="num py-1 text-right text-muted-foreground">{fmt(idx.high)}</TableCell>
                    <TableCell className="num py-1 text-right text-muted-foreground">{fmt(idx.low)}</TableCell>
                    <TableCell className="num py-1 text-right text-muted-foreground">{fmt(idx.yearHigh)}</TableCell>
                    <TableCell className="num py-1 text-right text-muted-foreground">{fmt(idx.yearLow)}</TableCell>
                    <TableCell className="num py-1 text-right">{idx.pe ? idx.pe.toFixed(1) : "—"}</TableCell>
                    <TableCell className="num py-1 text-right">{idx.pb ? idx.pb.toFixed(1) : "—"}</TableCell>
                    <TableCell className="num py-1 text-right">
                      {idx.divYield ? `${idx.divYield.toFixed(2)}%` : "—"}
                    </TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow>
                      <TableCell colSpan={12} className="p-0">
                        <ConstituentsTable index={idx.name} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Panel>
  );
}

export default function MarketsPage() {
  return (
    <div className="space-y-2 p-2">
      <PageHeader
        icon={Globe2}
        code="MKT"
        title="Markets"
        subtitle="All indices · movers · sector performance · constituents"
      />
      <div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <MoversPanel count={8} />
        </div>
        <SectorPerformance />
      </div>
      <DealsPanel />
      <AllIndicesTable />
    </div>
  );
}
