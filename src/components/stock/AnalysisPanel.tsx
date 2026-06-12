"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { Sparkles } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalysis } from "@/hooks/queries";
import { fmt } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Verdict } from "@/lib/analysis/engine";

const VERDICT_STYLES: Record<Verdict, string> = {
  BUY: "bg-bull/15 text-bull border-bull/40",
  HOLD: "bg-primary/15 text-primary border-primary/40",
  SELL: "bg-bear/15 text-bear border-bear/40",
};

function FactorBar({ score }: { score: number }) {
  const pct = Math.abs(score) * 50;
  return (
    <div className="relative h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-muted">
      <div className="absolute left-1/2 top-0 h-full w-px bg-border" />
      <div
        className={cn("absolute top-0 h-full", score >= 0 ? "bg-bull" : "bg-bear")}
        style={{
          width: `${pct}%`,
          left: score >= 0 ? "50%" : `${50 - pct}%`,
        }}
      />
    </div>
  );
}

export function AnalysisPanel({ symbol }: { symbol: string }) {
  const { data: a, isLoading, isError } = useAnalysis(symbol);

  return (
    <Panel
      code="ENGN"
      title={
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-primary" /> Signal Engine
        </span>
      }
      right={
        a ? (
          <span className="num text-[10px] text-muted-foreground">
            {formatDistanceToNowStrict(a.generatedAt)} ago ·{" "}
            {a.narrativeSource === "claude" ? "AI note" : "quant"}
          </span>
        ) : null
      }
    >
      {isLoading ? (
        <div className="space-y-2 p-2.5">
          <Skeleton className="h-10" />
          <Skeleton className="h-32" />
        </div>
      ) : isError || !a ? (
        <div className="p-3 text-xs text-muted-foreground">
          Not enough data to analyze this security.
        </div>
      ) : (
        <div className="space-y-3 p-2.5">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "rounded-sm border px-3 py-1 text-sm font-semibold tracking-wide",
                VERDICT_STYLES[a.verdict]
              )}
            >
              {a.verdict}
            </span>
            <div className="text-[11px] leading-tight text-muted-foreground">
              <div>
                Composite score{" "}
                <span className={cn("num", a.compositeScore >= 0 ? "text-bull" : "text-bear")}>
                  {a.compositeScore >= 0 ? "+" : ""}
                  {a.compositeScore.toFixed(2)}
                </span>{" "}
                / ±1.00
              </div>
              <div>
                Confidence: <span className="uppercase text-foreground">{a.confidence}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            {a.factors.map((f) => (
              <div key={f.name} className="flex items-start gap-2 text-[11px]">
                <FactorBar score={f.score} />
                <div className="min-w-0">
                  <span className="font-medium">{f.name}</span>{" "}
                  <span className="text-muted-foreground">{f.detail}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="num grid grid-cols-3 gap-2 border-t border-border/60 pt-2 text-[11px]">
            <div>
              <div className="text-muted-foreground">Support</div>
              <div>₹{fmt(a.technicals.support)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Resistance</div>
              <div>₹{fmt(a.technicals.resistance)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">
                Target {a.analyst.numberOfAnalysts ? `(${a.analyst.numberOfAnalysts})` : ""}
              </div>
              <div>
                {a.analyst.targetMeanPrice ? `₹${fmt(a.analyst.targetMeanPrice)}` : "—"}
                {a.analyst.upsidePercent !== undefined && (
                  <span className={cn("ml-1", a.analyst.upsidePercent >= 0 ? "text-bull" : "text-bear")}>
                    ({a.analyst.upsidePercent >= 0 ? "+" : ""}
                    {a.analyst.upsidePercent.toFixed(1)}%)
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="border-t border-border/60 pt-2 text-[11px] leading-relaxed text-foreground/90">
            {a.narrative}
          </p>

          <p className="text-[9px] leading-snug text-muted-foreground">
            Generated from free public data (delayed quotes, headline sentiment, street
            estimates). Educational signal only — not investment advice or a SEBI-registered
            recommendation.
          </p>
        </div>
      )}
    </Panel>
  );
}
