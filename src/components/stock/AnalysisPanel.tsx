"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalysis } from "@/hooks/queries";
import { fmt } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PillarScore } from "@/lib/analysis/engine";

function scoreColor(score: number) {
  return score >= 68 ? "var(--bull)" : score >= 45 ? "var(--primary)" : "var(--bear)";
}

function ScoreRing({ score }: { score: number }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--muted)" strokeWidth="6" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke={scoreColor(score)}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circ - filled}`}
          className="ring-sweep"
          style={{ "--ring-circ": `${circ}px` } as React.CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="num text-xl font-semibold leading-none">{score}</span>
        <span className="text-[8px] uppercase tracking-wider text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function PillarRow({ p }: { p: PillarScore }) {
  // For Risk, a high score is bad — invert the color read.
  const display = p.key === "risk" ? 100 - p.score : p.score;
  const detail = [...p.drivers, ...p.cautions][0] ?? "Insufficient data";
  return (
    <div className="group" title={[...p.drivers, ...p.cautions].join("\n")}>
      <div className="flex items-baseline justify-between text-[11px]">
        <span className={cn(!p.available && "text-muted-foreground/50")}>{p.name}</span>
        <span className="num" style={{ color: p.available ? scoreColor(display) : undefined }}>
          {p.available ? p.score : "—"}
          {p.available && p.key === "risk" && (
            <span className="ml-1 text-[9px] text-muted-foreground">
              ({p.score >= 55 ? "high" : p.score >= 40 ? "moderate" : "low"})
            </span>
          )}
        </span>
      </div>
      <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-muted">
        {p.available && (
          <div
            className="bar-grow h-full rounded-full"
            style={{ width: `${p.score}%`, backgroundColor: scoreColor(display) }}
          />
        )}
      </div>
      <div className="mt-0.5 truncate text-[10px] text-muted-foreground">{detail}</div>
    </div>
  );
}

const STANCE_STYLES = {
  Constructive: "border-bull/40 bg-bull/10 text-bull",
  Balanced: "border-primary/40 bg-primary/10 text-primary",
  Cautious: "border-bear/40 bg-bear/10 text-bear",
} as const;

export function AnalysisPanel({ symbol }: { symbol: string }) {
  const { data: a, isLoading, isError } = useAnalysis(symbol);

  return (
    <Panel
      code="INTL"
      title={
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-primary" /> Intelligence Score
        </span>
      }
      right={
        a ? (
          <span className="num text-[10px] text-muted-foreground">
            {formatDistanceToNowStrict(a.generatedAt)} ago ·{" "}
            {a.narrativeSource === "ai" ? "AI note" : "quant"}
            {a.sentimentSource === "ai" ? " · AI sentiment" : ""}
          </span>
        ) : null
      }
    >
      {isLoading ? (
        <div className="space-y-2 p-2.5">
          <Skeleton className="h-20" />
          <Skeleton className="h-44" />
        </div>
      ) : isError || !a ? (
        <div className="p-3 text-xs text-muted-foreground">
          Not enough data to score this security.
        </div>
      ) : (
        <div className="space-y-3 p-2.5">
          <div className="flex items-center gap-3">
            <ScoreRing score={a.overallScore} />
            <div className="min-w-0 space-y-1">
              <span
                className={cn(
                  "inline-block rounded-sm border px-2 py-0.5 text-xs font-semibold",
                  STANCE_STYLES[a.stance]
                )}
              >
                {a.stance}
              </span>
              <div className="text-[10px] leading-snug text-muted-foreground">
                Derived from {a.pillars.filter((p) => p.available).length} of 7 explainable
                pillars · confidence <span className="uppercase text-foreground">{a.confidence}</span>
              </div>
              <div className="num text-[10px] text-muted-foreground">
                {a.analyst.targetMeanPrice
                  ? `Street target ₹${fmt(a.analyst.targetMeanPrice)} (${a.analyst.upsidePercent !== undefined ? `${a.analyst.upsidePercent >= 0 ? "+" : ""}${a.analyst.upsidePercent.toFixed(1)}%` : ""})`
                  : "No street coverage data"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {a.pillars.map((p) => (
              <PillarRow key={p.key} p={p} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-2 border-t border-border/60 pt-2 lg:grid-cols-2">
            <div>
              <div className="mb-1 text-[9px] font-semibold uppercase tracking-widest text-bull">
                Drivers
              </div>
              <ul className="space-y-1 text-[10px] leading-snug">
                {a.drivers.length === 0 && <li className="text-muted-foreground">None dominant.</li>}
                {a.drivers.map((d, i) => (
                  <li key={i} className="flex gap-1">
                    <span className="text-bull">▲</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-1 text-[9px] font-semibold uppercase tracking-widest text-bear">
                Risks
              </div>
              <ul className="space-y-1 text-[10px] leading-snug">
                {a.risks.length === 0 && <li className="text-muted-foreground">No major flags.</li>}
                {a.risks.map((r, i) => (
                  <li key={i} className="flex gap-1">
                    <span className="text-bear">▼</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="border-t border-border/60 pt-2 text-[11px] leading-relaxed text-foreground/90">
            {a.narrative}
          </p>

          <p className="text-[9px] leading-snug text-muted-foreground">
            Transparent multi-pillar scoring from free public data — every number above is
            explainable (hover a pillar).{" "}
            <Link href="/guide" className="text-primary hover:underline">
              Methodology →
            </Link>{" "}
            Not investment advice.
          </p>
        </div>
      )}
    </Panel>
  );
}
