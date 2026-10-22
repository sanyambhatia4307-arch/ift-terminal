"use client";

import { useEffect, useState } from "react";
import { useIndices, useMarketStatus } from "@/hooks/queries";
import { fmt } from "@/lib/format";
import type { IndexQuote } from "@/types/market";

const ACRONYMS = new Set(["IT", "FMCG", "PSU", "CPSE", "MNC"]);

/** "NIFTY PSU BANK" -> "PSU Bank", "NIFTY FIN SERVICE" -> "Fin Service". */
function sectorName(q: IndexQuote): string {
  return (q.name ?? q.symbol)
    .replace(/^NIFTY\s+/i, "")
    .split(/\s+/)
    .map((w) => (ACRONYMS.has(w.toUpperCase()) ? w.toUpperCase() : w.charAt(0) + w.slice(1).toLowerCase()))
    .join(" ");
}

/**
 * Front-page headline for the dashboard, written from live data the way a
 * market wrap would be: what the index did, which sector led and lagged,
 * and how broad the move was.
 */
export function DashboardMasthead() {
  const { data } = useIndices();
  const { data: status } = useMarketStatus();
  const [dateline, setDateline] = useState("");

  useEffect(() => {
    setDateline(
      new Date().toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
  }, []);

  const open = !!status?.isOpen;
  const nifty = data?.headline.find((i) => /NIFTY 50/i.test(i.name ?? i.symbol)) ?? data?.headline[0];
  const sectors = [...(data?.sectors ?? [])].filter((s) => Number.isFinite(s.changePercent));
  sectors.sort((a, b) => b.changePercent - a.changePercent);
  const leader = sectors[0];
  const laggard = sectors.length > 1 ? sectors[sectors.length - 1] : undefined;
  const breadth =
    nifty?.advances != null && nifty?.declines != null && nifty.advances + nifty.declines > 0
      ? Math.round((nifty.advances / (nifty.advances + nifty.declines)) * 100)
      : undefined;

  const up = (nifty?.changePercent ?? 0) >= 0;
  const pct = nifty ? Math.abs(nifty.changePercent).toFixed(2) : "";

  return (
    <header className="panel-rise px-1 pb-1 pt-3">
      <div className="num flex flex-wrap items-center gap-x-2 text-[10px] tracking-[0.18em] text-muted-foreground/70">
        <span>{dateline.toUpperCase()}</span>
        {status && (
          <>
            <span aria-hidden>·</span>
            <span className={open ? "text-bull" : undefined}>NSE {open ? "OPEN" : "CLOSED"}</span>
          </>
        )}
      </div>
      <h1 className="font-display mt-1.5 text-[30px] leading-[1.02] text-foreground sm:text-[42px]">
        {nifty ? (
          <>
            NIFTY 50 {open ? "" : "closed "}
            {up ? "up" : "down"} <span className={up ? "text-bull" : "text-bear"}>{pct}%</span> at{" "}
            {fmt(nifty.last)}
          </>
        ) : (
          "Today in Indian markets"
        )}
      </h1>
      {(leader || breadth !== undefined) && (
        <p className="mt-2 max-w-3xl text-[13.5px] leading-snug text-muted-foreground">
          {leader && laggard && (
            <>
              <span className="text-foreground/85">{sectorName(leader)}</span> {open ? "leads" : "led"} at{" "}
              <span className={leader.changePercent >= 0 ? "num text-bull" : "num text-bear"}>
                {leader.changePercent >= 0 ? "+" : ""}
                {leader.changePercent.toFixed(2)}%
              </span>
              , <span className="text-foreground/85">{sectorName(laggard)}</span> {open ? "lags" : "lagged"} at{" "}
              <span className={laggard.changePercent >= 0 ? "num text-bull" : "num text-bear"}>
                {laggard.changePercent >= 0 ? "+" : ""}
                {laggard.changePercent.toFixed(2)}%
              </span>
              .{" "}
            </>
          )}
          {breadth !== undefined && (
            <>
              {breadth}% of NIFTY 50 stocks {open ? "are advancing" : "advanced"}.
            </>
          )}
        </p>
      )}
    </header>
  );
}
