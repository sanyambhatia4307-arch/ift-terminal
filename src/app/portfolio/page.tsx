"use client";

import { Briefcase, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/button";
import { FlashValue } from "@/components/ui/flash";
import { Input } from "@/components/ui/input";
import { Donut, type DonutSegment } from "@/components/ui/donut";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { StatBand, StatTile } from "@/components/ui/stat-tile";
import { useQuotes } from "@/hooks/queries";
import { changeClass, fmt, fmtInrCompact, fmtPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TONE } from "@/lib/tones";
import { usePortfolio } from "@/stores/portfolio";

const ALLOC_COLORS = [TONE.amber, TONE.cyan, TONE.violet, TONE.teal, TONE.blue, TONE.pink, TONE.green];

function AddHoldingForm() {
  const add = usePortfolio((s) => s.add);
  const [symbol, setSymbol] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");

  const valid = symbol.trim().length >= 2 && Number(qty) > 0 && Number(price) > 0;

  return (
    <form
      className="flex flex-wrap items-end gap-2 p-2.5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        add({ symbol: symbol.trim().toUpperCase(), qty: Number(qty), avgPrice: Number(price) });
        setSymbol("");
        setQty("");
        setPrice("");
      }}
    >
      <label className="flex flex-col gap-1 text-[9px] uppercase tracking-wider text-muted-foreground">
        NSE Symbol
        <Input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="e.g. RELIANCE"
          className="h-7 w-36 text-xs"
        />
      </label>
      <label className="flex flex-col gap-1 text-[9px] uppercase tracking-wider text-muted-foreground">
        Quantity
        <Input
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          type="number"
          min="1"
          placeholder="100"
          className="num h-7 w-24 text-xs"
        />
      </label>
      <label className="flex flex-col gap-1 text-[9px] uppercase tracking-wider text-muted-foreground">
        Avg Buy Price ₹
        <Input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          type="number"
          min="0.05"
          step="0.05"
          placeholder="1250.00"
          className="num h-7 w-28 text-xs"
        />
      </label>
      <Button type="submit" size="sm" disabled={!valid} className="h-7 gap-1 text-xs">
        <Plus className="h-3 w-3" /> Add
      </Button>
      <span className="text-[10px] text-muted-foreground">
        Adding an existing symbol averages into the position. Stored only in your browser.
      </span>
    </form>
  );
}

export default function PortfolioPage() {
  const holdings = usePortfolio((s) => s.holdings);
  const remove = usePortfolio((s) => s.remove);
  const symbols = useMemo(() => [...new Set(holdings.map((h) => h.symbol))], [holdings]);
  const { data: quotes, isLoading } = useQuotes(symbols);

  const rows = holdings.map((h) => {
    const q = quotes?.find((x) => x.symbol === h.symbol);
    const invested = h.qty * h.avgPrice;
    const value = q ? h.qty * q.last : undefined;
    const pnl = value !== undefined ? value - invested : undefined;
    const dayPnl = q?.change !== undefined ? h.qty * q.change : undefined;
    return { ...h, q, invested, value, pnl, dayPnl };
  });

  const totalInvested = rows.reduce((a, r) => a + r.invested, 0);
  const totalValue = rows.reduce((a, r) => a + (r.value ?? r.invested), 0);
  const totalPnl = totalValue - totalInvested;
  const totalDayPnl = rows.reduce((a, r) => a + (r.dayPnl ?? 0), 0);

  // Allocation donut — top 6 positions by value, rest grouped as "Others".
  const allocation: DonutSegment[] = (() => {
    const sized = rows
      .map((r) => ({ symbol: r.symbol, value: r.value ?? r.invested }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value);
    const head = sized.slice(0, 6);
    const rest = sized.slice(6).reduce((a, r) => a + r.value, 0);
    const segs: DonutSegment[] = head.map((r, i) => ({
      label: r.symbol,
      value: r.value,
      color: ALLOC_COLORS[i % ALLOC_COLORS.length],
    }));
    if (rest > 0) segs.push({ label: "Others", value: rest, color: TONE.orange });
    return segs;
  })();

  return (
    <div className="space-y-2 p-2">
      <PageHeader
        icon={Briefcase}
        code="PORT"
        title="Portfolio"
        subtitle="Live P&L on your holdings · stored locally in your browser"
      />

      {holdings.length > 0 && (
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1.6fr_1fr]">
          <StatBand cols={4}>
            <StatTile label="Invested" numeric={totalInvested} format={fmtInrCompact} tone="neutral" />
            <StatTile label="Current Value" numeric={totalValue} format={fmtInrCompact} tone="primary" />
            <StatTile
              label="Total P&L"
              numeric={totalPnl}
              format={(n) => `${n >= 0 ? "+" : "−"}${fmtInrCompact(Math.abs(n))}`}
              sub={totalInvested > 0 ? fmtPct((totalPnl / totalInvested) * 100) : ""}
              tone={totalPnl >= 0 ? "bull" : "bear"}
            />
            <StatTile
              label="Day's P&L"
              numeric={totalDayPnl}
              format={(n) => `${n >= 0 ? "+" : "−"}${fmtInrCompact(Math.abs(n))}`}
              tone={totalDayPnl >= 0 ? "bull" : "bear"}
            />
          </StatBand>
          <Panel code="ALLOC" title="Allocation by value">
            <div className="p-3">
              {allocation.length > 0 ? (
                <Donut
                  segments={allocation}
                  centerTop={String(holdings.length)}
                  centerSub="HOLDINGS"
                />
              ) : (
                <div className="text-[11px] text-muted-foreground">Live values loading…</div>
              )}
            </div>
          </Panel>
        </div>
      )}

      <Panel code="HOLD" title={`Holdings (${holdings.length})`}>
        <AddHoldingForm />
        {holdings.length === 0 ? (
          <div className="border-t border-border p-6 text-center text-xs text-muted-foreground">
            No holdings yet — add your first position above to see live P&L.
          </div>
        ) : isLoading ? (
          <Skeleton className="m-2 h-40" />
        ) : (
          <>
            <div className="flex items-center gap-2 border-y border-border bg-secondary/20 px-2.5 py-1 text-[9px] uppercase tracking-wider text-muted-foreground">
              <span className="w-24">Symbol</span>
              <span className="w-14 text-right">Qty</span>
              <span className="w-20 text-right">Avg Cost</span>
              <span className="w-20 text-right">LTP</span>
              <span className="w-24 text-right">Invested</span>
              <span className="w-24 text-right">Value</span>
              <span className="w-28 text-right">Total P&L</span>
              <span className="w-24 text-right">Day P&L</span>
              <span className="flex-1 text-right">Weight</span>
              <span className="w-8" />
            </div>
            <div className="divide-y divide-border/60">
              {rows.map((r) => (
                <div key={r.id} className="flex items-center gap-2 px-2.5 py-1.5 text-[11px]">
                  <Link
                    href={`/stock/${encodeURIComponent(r.symbol)}`}
                    className="num w-24 truncate font-medium text-primary hover:underline"
                  >
                    {r.symbol}
                  </Link>
                  <span className="num w-14 text-right">{r.qty}</span>
                  <span className="num w-20 text-right text-muted-foreground">{fmt(r.avgPrice)}</span>
                  <span className="num w-20 text-right">
                    <FlashValue value={r.q?.last}>{r.q ? fmt(r.q.last) : "…"}</FlashValue>
                  </span>
                  <span className="num w-24 text-right text-muted-foreground">
                    {fmtInrCompact(r.invested)}
                  </span>
                  <span className="num w-24 text-right">
                    {r.value !== undefined ? fmtInrCompact(r.value) : "…"}
                  </span>
                  <span className={cn("num w-28 text-right", changeClass(r.pnl))}>
                    {r.pnl !== undefined
                      ? `${r.pnl >= 0 ? "+" : "−"}${fmtInrCompact(Math.abs(r.pnl))} (${fmtPct((r.pnl / r.invested) * 100)})`
                      : "…"}
                  </span>
                  <span className={cn("num w-24 text-right", changeClass(r.dayPnl))}>
                    {r.dayPnl !== undefined
                      ? `${r.dayPnl >= 0 ? "+" : "−"}${fmtInrCompact(Math.abs(r.dayPnl))}`
                      : "…"}
                  </span>
                  <span className="flex-1 text-right">
                    <span className="num text-[10px] text-muted-foreground">
                      {totalValue > 0 && r.value !== undefined
                        ? `${((r.value / totalValue) * 100).toFixed(1)}%`
                        : ""}
                    </span>
                    <span className="ml-2 inline-block h-1.5 w-16 overflow-hidden rounded-full bg-muted align-middle">
                      <span
                        className="block h-full rounded-full bg-primary/70"
                        style={{
                          width:
                            totalValue > 0 && r.value !== undefined
                              ? `${(r.value / totalValue) * 100}%`
                              : 0,
                        }}
                      />
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-8 text-muted-foreground hover:text-bear"
                    onClick={() => remove(r.id)}
                    aria-label={`Remove ${r.symbol}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </Panel>
      <p className="px-1 text-[9px] text-muted-foreground">
        Quotes may be delayed up to 15 minutes; P&L excludes brokerage, taxes and corporate
        actions. Data never leaves your browser.
      </p>
    </div>
  );
}
