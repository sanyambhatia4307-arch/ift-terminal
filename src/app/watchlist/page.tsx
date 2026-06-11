"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
import { useQuotes } from "@/hooks/queries";
import { changeClass, fmt, fmtPct, fmtVolume } from "@/lib/format";
import { useWatchlist } from "@/stores/watchlist";

export default function WatchlistPage() {
  const symbols = useWatchlist((s) => s.symbols);
  const remove = useWatchlist((s) => s.remove);
  const { data: quotes, isLoading, dataUpdatedAt } = useQuotes(symbols);

  return (
    <div className="p-2">
      <Panel
        title={`Watchlist (${symbols.length})`}
        right={
          dataUpdatedAt ? (
            <span className="num text-[10px] text-muted-foreground">
              Updated {new Date(dataUpdatedAt).toLocaleTimeString("en-IN", { hour12: false })}
            </span>
          ) : null
        }
      >
        {symbols.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            Your watchlist is empty. Use ⌘K search to find a stock, then press
            “Watch” on its research page.
          </div>
        ) : isLoading ? (
          <Skeleton className="m-2 h-64" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-[10px] uppercase tracking-wider">
                <TableHead className="h-7">Symbol</TableHead>
                <TableHead className="h-7">Name</TableHead>
                <TableHead className="h-7 text-right">Last</TableHead>
                <TableHead className="h-7 text-right">Chg</TableHead>
                <TableHead className="h-7 text-right">Chg%</TableHead>
                <TableHead className="h-7 text-right">Day Range</TableHead>
                <TableHead className="h-7 text-right">52W Range</TableHead>
                <TableHead className="h-7 text-right">Volume</TableHead>
                <TableHead className="h-7 w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {symbols.map((symbol) => {
                const q = quotes?.find((x) => x.symbol === symbol);
                return (
                  <TableRow key={symbol} className="text-xs">
                    <TableCell className="num py-1.5 font-medium">
                      <Link
                        href={`/stock/${encodeURIComponent(symbol)}`}
                        className="text-primary hover:underline"
                      >
                        {symbol}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-48 truncate py-1.5 text-muted-foreground">
                      {q?.name ?? "…"}
                    </TableCell>
                    <TableCell className="num py-1.5 text-right">
                      {q ? fmt(q.last) : "…"}
                    </TableCell>
                    <TableCell className={`num py-1.5 text-right ${changeClass(q?.change)}`}>
                      {q ? `${q.change > 0 ? "+" : ""}${fmt(q.change)}` : ""}
                    </TableCell>
                    <TableCell
                      className={`num py-1.5 text-right ${changeClass(q?.changePercent)}`}
                    >
                      {q ? fmtPct(q.changePercent) : ""}
                    </TableCell>
                    <TableCell className="num py-1.5 text-right text-muted-foreground">
                      {q ? `${fmt(q.low)} – ${fmt(q.high)}` : ""}
                    </TableCell>
                    <TableCell className="num py-1.5 text-right text-muted-foreground">
                      {q ? `${fmt(q.yearLow)} – ${fmt(q.yearHigh)}` : ""}
                    </TableCell>
                    <TableCell className="num py-1.5 text-right text-muted-foreground">
                      {q ? fmtVolume(q.volume) : ""}
                    </TableCell>
                    <TableCell className="py-1.5 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-bear"
                        onClick={() => remove(symbol)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Panel>
    </div>
  );
}
