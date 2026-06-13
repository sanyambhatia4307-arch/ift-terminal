"use client";

import { ShieldAlert } from "lucide-react";
import { useMemo } from "react";
import { Panel } from "@/components/ui/panel";
import { useBetas, useScreener } from "@/hooks/queries";
import { fmtInrCompact } from "@/lib/format";
import { TONE } from "@/lib/tones";
import { cn } from "@/lib/utils";

export interface RiskPosition {
  symbol: string;
  value: number; // current market value (falls back to invested)
  invested: number;
  pnl?: number;
}

const SECTOR_COLORS = [
  TONE.amber, TONE.cyan, TONE.violet, TONE.teal, TONE.blue, TONE.pink, TONE.green, TONE.orange, TONE.red,
];

function Metric({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "bull" | "bear" | "warn" | "neutral";
}) {
  const color =
    tone === "bull" ? "text-bull" : tone === "bear" ? "text-bear" : tone === "warn" ? "text-primary" : "text-foreground";
  return (
    <div className="rounded-sm border border-border bg-background/40 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("num text-base font-semibold leading-tight", color)}>{value}</div>
      {sub && <div className="num text-[9px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function PortfolioRisk({ positions }: { positions: RiskPosition[] }) {
  const { data: screener } = useScreener();
  const symbols = useMemo(() => positions.map((p) => p.symbol), [positions]);
  const { data: betas } = useBetas(symbols);

  const meta = useMemo(() => {
    const map = new Map<string, { sector?: string; beta?: number }>();
    for (const r of screener?.rows ?? []) {
      map.set(r.symbol.toUpperCase(), { sector: r.sector });
    }
    // Computed NIFTY beta overrides any vendor field.
    for (const [sym, beta] of Object.entries(betas ?? {})) {
      const key = sym.toUpperCase();
      map.set(key, { ...(map.get(key) ?? {}), beta });
    }
    return map;
  }, [screener, betas]);

  const risk = useMemo(() => {
    const total = positions.reduce((a, p) => a + p.value, 0);
    if (total <= 0 || positions.length === 0) return null;

    const weights = positions
      .map((p) => ({ ...p, w: p.value / total, ...(meta.get(p.symbol.toUpperCase()) ?? {}) }))
      .sort((a, b) => b.w - a.w);

    // Concentration
    const top5 = weights.slice(0, 5).reduce((a, p) => a + p.w, 0) * 100;
    const largest = weights[0];
    const hhi = weights.reduce((a, p) => a + p.w * p.w, 0);
    const effN = 1 / hhi; // effective number of equally-weighted positions

    // Sector exposure
    const sectorMap = new Map<string, number>();
    for (const p of weights) {
      const s = p.sector ?? "Unclassified";
      sectorMap.set(s, (sectorMap.get(s) ?? 0) + p.value);
    }
    const sectors = [...sectorMap.entries()]
      .map(([name, value]) => ({ name, value, pct: (value / total) * 100 }))
      .sort((a, b) => b.value - a.value);
    const topSector = sectors[0];

    // Portfolio beta (renormalised over positions that have a beta)
    const withBeta = weights.filter((p) => p.beta != null);
    const betaWeight = withBeta.reduce((a, p) => a + p.w, 0);
    const beta =
      betaWeight > 0 ? withBeta.reduce((a, p) => a + (p.beta as number) * (p.w / betaWeight), 0) : undefined;

    // Contribution to total P&L
    const byPnl = positions
      .filter((p) => p.pnl != null)
      .map((p) => ({ symbol: p.symbol, pnl: p.pnl as number }))
      .sort((a, b) => b.pnl - a.pnl);
    const contributors = byPnl.slice(0, 2);
    const detractors = byPnl.slice(-2).reverse().filter((d) => d.pnl < 0);

    return { total, weights, top5, largest, effN, sectors, topSector, beta, betaCoverage: betaWeight, contributors, detractors };
  }, [positions, meta]);

  if (!risk) return null;

  const concentrated = risk.largest.w > 0.25 || risk.top5 > 70 || risk.topSector.pct > 40;

  return (
    <Panel
      code="RISK"
      title={
        <span className="flex items-center gap-1.5">
          <ShieldAlert className="h-3 w-3" /> Risk &amp; Exposure
        </span>
      }
      right={
        concentrated ? (
          <span className="num rounded-sm border border-bear/40 bg-bear/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-bear">
            Concentrated
          </span>
        ) : (
          <span className="num rounded-sm border border-bull/40 bg-bull/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-bull">
            Diversified
          </span>
        )
      }
    >
      <div className="grid grid-cols-1 gap-3 p-2.5 lg:grid-cols-2">
        {/* Concentration + beta metrics */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Metric
              label="Largest position"
              value={`${(risk.largest.w * 100).toFixed(1)}%`}
              sub={risk.largest.symbol}
              tone={risk.largest.w > 0.25 ? "warn" : "neutral"}
            />
            <Metric label="Top-5 weight" value={`${risk.top5.toFixed(0)}%`} sub={`${risk.weights.length} holdings`} tone={risk.top5 > 70 ? "warn" : "neutral"} />
            <Metric
              label="Effective positions"
              value={risk.effN.toFixed(1)}
              sub="diversification (1/HHI)"
              tone={risk.effN < 4 ? "warn" : "neutral"}
            />
            <Metric
              label="Portfolio beta"
              value={risk.beta != null && risk.betaCoverage >= 0.6 ? risk.beta.toFixed(2) : "n/a"}
              sub={
                risk.beta != null && risk.betaCoverage >= 0.6
                  ? `vs NIFTY · 1y daily${risk.betaCoverage < 0.99 ? ` · ${(risk.betaCoverage * 100).toFixed(0)}% cov` : ""}`
                  : "computing…"
              }
              tone={risk.beta != null && risk.betaCoverage >= 0.6 && risk.beta > 1.15 ? "warn" : "neutral"}
            />
          </div>

          {(risk.contributors.length > 0 || risk.detractors.length > 0) && (
            <div className="rounded-sm border border-border bg-background/40 px-2 py-1.5">
              <div className="mb-1 text-[9px] uppercase tracking-wider text-muted-foreground">
                Contribution to P&amp;L
              </div>
              <div className="space-y-0.5 text-[10px]">
                {risk.contributors.filter((c) => c.pnl > 0).map((c) => (
                  <div key={c.symbol} className="flex justify-between">
                    <span className="text-bull">▲ {c.symbol}</span>
                    <span className="num text-bull">+{fmtInrCompact(c.pnl)}</span>
                  </div>
                ))}
                {risk.detractors.map((c) => (
                  <div key={c.symbol} className="flex justify-between">
                    <span className="text-bear">▼ {c.symbol}</span>
                    <span className="num text-bear">−{fmtInrCompact(Math.abs(c.pnl))}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sector exposure bars */}
        <div>
          <div className="mb-1 text-[9px] uppercase tracking-wider text-muted-foreground">
            Sector exposure
          </div>
          <div className="space-y-1">
            {risk.sectors.map((s, i) => (
              <div key={s.name} className="flex items-center gap-2 text-[10px]">
                <span className="w-28 truncate text-muted-foreground" title={s.name}>
                  {s.name}
                </span>
                <span className="relative h-3 flex-1 overflow-hidden rounded-sm bg-muted">
                  <span
                    className="block h-full rounded-sm"
                    style={{
                      width: `${s.pct}%`,
                      backgroundColor: SECTOR_COLORS[i % SECTOR_COLORS.length],
                    }}
                  />
                </span>
                <span className="num w-10 text-right text-foreground/90">{s.pct.toFixed(0)}%</span>
              </div>
            ))}
          </div>
          {risk.topSector.pct > 40 && (
            <p className="mt-1.5 text-[9px] leading-snug text-bear">
              {risk.topSector.pct.toFixed(0)}% in {risk.topSector.name} · single-sector concentration risk.
            </p>
          )}
        </div>
      </div>
    </Panel>
  );
}
