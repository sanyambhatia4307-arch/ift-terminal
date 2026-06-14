"use client";

import { Radar } from "lucide-react";
import { useMemo } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { StatBand, StatTile } from "@/components/ui/stat-tile";
import { useRotation } from "@/hooks/queries";
import { changeClass } from "@/lib/format";
import { TONE } from "@/lib/tones";
import { cn } from "@/lib/utils";
import type { Quadrant, SectorRS } from "@/lib/analysis/rotation";

const QUAD_COLOR: Record<Quadrant, string> = {
  Leading: TONE.green,
  Improving: TONE.blue,
  Weakening: TONE.orange,
  Lagging: TONE.red,
};
const QUAD_CLASS: Record<Quadrant, string> = {
  Leading: "border-bull/40 bg-bull/10 text-bull",
  Improving: "border-primary/40 bg-primary/10 text-primary",
  Weakening: "border-[color:var(--flat)]/40 text-foreground/80",
  Lagging: "border-bear/40 bg-bear/10 text-bear",
};

function abbr(name: string): string {
  const map: Record<string, string> = {
    "Fin Services": "FIN",
    "PSU Bank": "PSU",
  };
  return map[name] ?? name.slice(0, 3).toUpperCase();
}

const fpct = (n?: number) => (n == null ? "—" : `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`);

function RRG({ sectors }: { sectors: SectorRS[] }) {
  const pts = sectors.filter((s) => s.rsLevel != null && s.rsMomentum != null);
  const maxX = Math.max(2, ...pts.map((s) => Math.abs(s.rsLevel!))) * 1.2;
  const maxY = Math.max(2, ...pts.map((s) => Math.abs(s.rsMomentum!))) * 1.2;

  const W = 400;
  const H = 360;
  const pad = 28;
  const cx = W / 2;
  const cy = H / 2;
  const px = (v: number) => cx + (v / maxX) * (W / 2 - pad);
  const py = (v: number) => cy - (v / maxY) * (H / 2 - pad);

  const quads: Array<{ q: Quadrant; x: number; y: number; anchor: string }> = [
    { q: "Improving", x: pad, y: pad + 4, anchor: "start" },
    { q: "Leading", x: W - pad, y: pad + 4, anchor: "end" },
    { q: "Lagging", x: pad, y: H - pad + 2, anchor: "start" },
    { q: "Weakening", x: W - pad, y: H - pad + 2, anchor: "end" },
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
      {/* quadrant tints */}
      <rect x={cx} y={0} width={cx} height={cy} fill={TONE.green} opacity={0.06} />
      <rect x={0} y={0} width={cx} height={cy} fill={TONE.blue} opacity={0.06} />
      <rect x={0} y={cy} width={cx} height={cy} fill={TONE.red} opacity={0.06} />
      <rect x={cx} y={cy} width={cx} height={cy} fill={TONE.orange} opacity={0.06} />
      {/* axes */}
      <line x1={cx} y1={pad / 2} x2={cx} y2={H - pad / 2} stroke="var(--border)" strokeWidth={1} />
      <line x1={pad / 2} y1={cy} x2={W - pad / 2} y2={cy} stroke="var(--border)" strokeWidth={1} />
      {quads.map((q) => (
        <text key={q.q} x={q.x} y={q.y} textAnchor={q.anchor as "start" | "end"} fontSize={9} fill={QUAD_COLOR[q.q]} className="uppercase" style={{ letterSpacing: "0.08em", fontWeight: 600 }}>
          {q.q}
        </text>
      ))}
      <text x={W - 4} y={cy - 4} textAnchor="end" fontSize={8} fill="var(--muted-foreground)">
        rel. strength →
      </text>
      <text x={cx + 4} y={pad / 2 + 6} fontSize={8} fill="var(--muted-foreground)">
        ↑ momentum
      </text>
      {/* dots */}
      {pts.map((s) => {
        const x = px(s.rsLevel!);
        const y = py(s.rsMomentum!);
        const color = s.quadrant ? QUAD_COLOR[s.quadrant] : TONE.cyan;
        return (
          <g key={s.symbol}>
            <circle cx={x} cy={y} r={4} fill={color} />
            <text x={x + 6} y={y + 3} fontSize={9} fill="var(--foreground)" className="num" style={{ fontWeight: 600 }}>
              {abbr(s.name)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function RotationPage() {
  const { data, isLoading, isError, dataUpdatedAt } = useRotation();

  const summary = useMemo(() => {
    if (!data) return null;
    const ranked = data.sectors.filter((s) => s.rsScore != null);
    const leading = data.sectors.filter((s) => s.quadrant === "Leading").length;
    return {
      strongest: ranked[0],
      weakest: ranked[ranked.length - 1],
      leading,
    };
  }, [data]);

  return (
    <div className="space-y-2 p-2">
      <PageHeader
        icon={Radar}
        code="ROTN"
        title="Sector Rotation"
        subtitle="Relative strength vs NIFTY 50 · 1M / 3M / 6M · where leadership is moving"
        right={
          dataUpdatedAt ? (
            <span className="num text-[10px] text-muted-foreground">
              {new Date(dataUpdatedAt).toLocaleTimeString("en-IN", { hour12: false })}
            </span>
          ) : null
        }
      />

      {data && summary && (
        <StatBand cols={4}>
          <StatTile label="NIFTY 50 · 3M" value={fpct(data.benchmark.ret3M)} sub="benchmark return" tone={(data.benchmark.ret3M ?? 0) >= 0 ? "bull" : "bear"} />
          <StatTile label="Strongest" value={summary.strongest?.name ?? "—"} sub={`RS ${fpct(summary.strongest?.rs3M)} (3M)`} tone="bull" />
          <StatTile label="Weakest" value={summary.weakest?.name ?? "—"} sub={`RS ${fpct(summary.weakest?.rs3M)} (3M)`} tone="bear" />
          <StatTile label="Leading" numeric={summary.leading} format={(n) => String(Math.round(n))} sub="sectors outperforming + rising" tone="primary" />
        </StatBand>
      )}

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1fr_1.1fr]">
        <Panel code="RRG" title="Relative Rotation Graph">
          {isLoading ? (
            <Skeleton className="m-2 h-72" />
          ) : isError || !data ? (
            <div className="p-6 text-center text-xs text-muted-foreground">Rotation data unavailable.</div>
          ) : (
            <div className="p-2.5">
              <RRG sectors={data.sectors} />
              <p className="text-[9px] leading-snug text-muted-foreground">
                X = 3-month relative strength vs NIFTY; Y = momentum of that relative strength (1M − 3M).
                Sectors rotate clockwise: Improving → Leading → Weakening → Lagging.
              </p>
            </div>
          )}
        </Panel>

        <Panel code="ROTN" title="Relative strength table">
          {isLoading ? (
            <Skeleton className="m-2 h-72" />
          ) : isError || !data ? (
            <div className="p-6 text-center text-xs text-muted-foreground">Rotation data unavailable.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-border text-[9px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-1.5 pl-2.5 text-left font-medium">Sector</th>
                    <th className="py-1.5 text-right font-medium">1M</th>
                    <th className="py-1.5 text-right font-medium">3M</th>
                    <th className="py-1.5 text-right font-medium">6M</th>
                    <th className="py-1.5 text-right font-medium">RS 3M</th>
                    <th className="py-1.5 pr-2.5 text-right font-medium">Phase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {data.sectors.map((s) => (
                    <tr key={s.symbol}>
                      <td className="py-1.5 pl-2.5 text-left font-medium text-foreground/90">{s.name}</td>
                      <td className={cn("num py-1.5 text-right", changeClass(s.ret1M))}>{fpct(s.ret1M)}</td>
                      <td className={cn("num py-1.5 text-right", changeClass(s.ret3M))}>{fpct(s.ret3M)}</td>
                      <td className={cn("num py-1.5 text-right", changeClass(s.ret6M))}>{fpct(s.ret6M)}</td>
                      <td className={cn("num py-1.5 text-right", changeClass(s.rs3M))}>{fpct(s.rs3M)}</td>
                      <td className="py-1.5 pr-2.5 text-right">
                        {s.quadrant ? (
                          <span className={cn("num rounded-sm border px-1 py-px text-[9px] uppercase", QUAD_CLASS[s.quadrant])}>
                            {s.quadrant}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
      <p className="px-1 text-[9px] text-muted-foreground">
        RS = sector index return − NIFTY 50 return over the same window. Positive RS means the sector is
        outperforming the market. Sector indices via Yahoo. Not investment advice.
      </p>
    </div>
  );
}
