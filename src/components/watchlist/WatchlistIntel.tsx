"use client";

import { Bell, Trash2, Zap } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Panel } from "@/components/ui/panel";
import { fmt, fmtPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAlerts } from "@/stores/alerts";
import type { StockQuote } from "@/types/market";

interface Signal {
  symbol: string;
  text: string;
  tone: "bull" | "bear" | "neutral";
}

function buildSignals(quotes: StockQuote[]): Signal[] {
  const out: Signal[] = [];
  for (const q of quotes) {
    if (Math.abs(q.changePercent) >= 3) {
      out.push({
        symbol: q.symbol,
        text: `${q.changePercent >= 0 ? "▲" : "▼"} ${fmtPct(q.changePercent)} today`,
        tone: q.changePercent >= 0 ? "bull" : "bear",
      });
    }
    if (q.yearHigh && q.last >= q.yearHigh * 0.97) {
      out.push({ symbol: q.symbol, text: "within 3% of 52-week high", tone: "bull" });
    } else if (q.yearLow && q.last <= q.yearLow * 1.03) {
      out.push({ symbol: q.symbol, text: "within 3% of 52-week low", tone: "bear" });
    }
  }
  // Movers first, ranked by magnitude.
  return out.sort((a, b) => (a.tone === "neutral" ? 1 : 0) - (b.tone === "neutral" ? 1 : 0));
}

export function WatchlistIntel({
  quotes,
  symbols,
}: {
  quotes: StockQuote[] | undefined;
  symbols: string[];
}) {
  const { alerts, add, remove } = useAlerts();
  const [sym, setSym] = useState("");
  const [dir, setDir] = useState<"above" | "below">("above");
  const [price, setPrice] = useState("");

  const signals = useMemo(() => buildSignals(quotes ?? []), [quotes]);
  const quoteFor = (s: string) => quotes?.find((q) => q.symbol.toUpperCase() === s.toUpperCase());

  const triggeredCount = alerts.filter((a) => {
    const q = quoteFor(a.symbol);
    if (!q) return false;
    return a.direction === "above" ? q.last >= a.price : q.last <= a.price;
  }).length;

  const valid = sym && Number(price) > 0;

  return (
    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
      <Panel
        code="SIGS"
        title={
          <span className="flex items-center gap-1.5">
            <Zap className="h-3 w-3" /> What changed today
          </span>
        }
      >
        <div className="p-2.5">
          {signals.length === 0 ? (
            <div className="text-[11px] text-muted-foreground">
              Nothing notable · no watchlist name has moved 3%+ or is near a 52-week extreme.
            </div>
          ) : (
            <ul className="space-y-1">
              {signals.slice(0, 8).map((s, i) => (
                <li key={`${s.symbol}-${i}`} className="flex items-center justify-between text-[11px]">
                  <Link
                    href={`/stock/${encodeURIComponent(s.symbol)}`}
                    className="num font-medium text-primary hover:underline"
                  >
                    {s.symbol}
                  </Link>
                  <span
                    className={cn(
                      "num",
                      s.tone === "bull" ? "text-bull" : s.tone === "bear" ? "text-bear" : "text-muted-foreground"
                    )}
                  >
                    {s.text}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>

      <Panel
        code="ALRT"
        title={
          <span className="flex items-center gap-1.5">
            <Bell className="h-3 w-3" /> Price alerts
          </span>
        }
        right={
          triggeredCount > 0 ? (
            <span className="num rounded-sm border border-bull/40 bg-bull/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-bull">
              {triggeredCount} triggered
            </span>
          ) : null
        }
      >
        <div className="space-y-2 p-2.5">
          <form
            className="flex flex-wrap items-end gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!valid) return;
              add({ symbol: sym, direction: dir, price: Number(price) });
              setSym("");
              setPrice("");
            }}
          >
            <select
              value={sym}
              onChange={(e) => setSym(e.target.value)}
              className="h-6 rounded-sm border border-border bg-background px-1 text-[11px] text-foreground focus:border-ring focus:outline-none"
            >
              <option value="">Symbol…</option>
              {symbols.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={dir}
              onChange={(e) => setDir(e.target.value as "above" | "below")}
              className="h-6 rounded-sm border border-border bg-background px-1 text-[11px] text-foreground focus:border-ring focus:outline-none"
            >
              <option value="above">crosses above</option>
              <option value="below">drops below</option>
            </select>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="₹ price"
              className="num h-6 w-20 rounded-sm border border-border bg-background px-1.5 text-[11px] text-foreground focus:border-ring focus:outline-none"
            />
            <button
              type="submit"
              disabled={!valid}
              className="h-6 rounded-sm border border-primary/50 bg-primary/15 px-2 text-[11px] text-primary disabled:opacity-40"
            >
              Set
            </button>
          </form>

          {alerts.length === 0 ? (
            <div className="text-[10px] text-muted-foreground">
              No alerts set. Alerts evaluate against live quotes on each refresh (browser-side).
            </div>
          ) : (
            <ul className="divide-y divide-border/50">
              {alerts.map((a) => {
                const q = quoteFor(a.symbol);
                const fired = q ? (a.direction === "above" ? q.last >= a.price : q.last <= a.price) : false;
                return (
                  <li key={a.id} className="flex items-center gap-2 py-1 text-[11px]">
                    <span className="num w-20 font-medium">{a.symbol}</span>
                    <span className="num flex-1 text-muted-foreground">
                      {a.direction === "above" ? "↑ above" : "↓ below"} ₹{fmt(a.price)}
                      {q ? <span className="ml-1.5 text-foreground/70">(now ₹{fmt(q.last)})</span> : ""}
                    </span>
                    {fired ? (
                      <span
                        className={cn(
                          "num rounded-sm border px-1 py-px text-[9px] font-semibold uppercase",
                          a.direction === "above"
                            ? "border-bull/40 bg-bull/10 text-bull"
                            : "border-bear/40 bg-bear/10 text-bear"
                        )}
                      >
                        Triggered
                      </span>
                    ) : (
                      <span className="num rounded-sm border border-border px-1 py-px text-[9px] uppercase text-muted-foreground">
                        Armed
                      </span>
                    )}
                    <button
                      onClick={() => remove(a.id)}
                      className="text-muted-foreground hover:text-bear"
                      aria-label={`Remove alert for ${a.symbol}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Panel>
    </div>
  );
}
