"use client";

import { MoversPanel } from "@/components/dashboard/MoversPanel";
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
import { changeClass, fmt, fmtPct } from "@/lib/format";

function AllIndicesTable() {
  const { data, isLoading } = useIndices();

  if (isLoading) return <Skeleton className="h-96" />;

  return (
    <Panel title={`All Indices (${data?.all.length ?? 0})`}>
      <div className="max-h-[70vh] overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-card">
            <TableRow className="text-[10px] uppercase tracking-wider">
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
            {data?.all.map((idx) => (
              <TableRow key={idx.symbol} className="text-xs">
                <TableCell className="py-1 font-medium">{idx.name}</TableCell>
                <TableCell className="num py-1 text-right">{fmt(idx.last)}</TableCell>
                <TableCell
                  className={`num py-1 text-right ${changeClass(idx.changePercent)}`}
                >
                  {fmtPct(idx.changePercent)}
                </TableCell>
                <TableCell className="num py-1 text-right text-muted-foreground">
                  {fmt(idx.open)}
                </TableCell>
                <TableCell className="num py-1 text-right text-muted-foreground">
                  {fmt(idx.high)}
                </TableCell>
                <TableCell className="num py-1 text-right text-muted-foreground">
                  {fmt(idx.low)}
                </TableCell>
                <TableCell className="num py-1 text-right text-muted-foreground">
                  {fmt(idx.yearHigh)}
                </TableCell>
                <TableCell className="num py-1 text-right text-muted-foreground">
                  {fmt(idx.yearLow)}
                </TableCell>
                <TableCell className="num py-1 text-right">
                  {idx.pe ? idx.pe.toFixed(1) : "—"}
                </TableCell>
                <TableCell className="num py-1 text-right">
                  {idx.pb ? idx.pb.toFixed(1) : "—"}
                </TableCell>
                <TableCell className="num py-1 text-right">
                  {idx.divYield ? `${idx.divYield.toFixed(2)}%` : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Panel>
  );
}

export default function MarketsPage() {
  return (
    <div className="space-y-2 p-2">
      <div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <MoversPanel count={8} />
        </div>
        <SectorPerformance />
      </div>
      <AllIndicesTable />
    </div>
  );
}
