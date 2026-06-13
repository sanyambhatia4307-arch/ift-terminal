"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  LineSeries,
  LineStyle,
  type IChartApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useChart } from "@/hooks/queries";
import { fmt } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ForecastResult } from "@/lib/analysis/forecast";

const RANGES: Array<{ label: string; range: string; interval: string; horizon?: number }> = [
  { label: "1D", range: "1d", interval: "5m" },
  { label: "5D", range: "5d", interval: "15m" },
  { label: "1M", range: "1mo", interval: "1h" },
  { label: "6M", range: "6mo", interval: "1d", horizon: 22 },
  { label: "1Y", range: "1y", interval: "1d", horizon: 45 },
  { label: "5Y", range: "5y", interval: "1wk" },
  { label: "MAX", range: "max", interval: "1mo" },
];

const SIGNAL_STYLES = {
  bullish: "border-bull/40 bg-bull/10 text-bull",
  bearish: "border-bear/40 bg-bear/10 text-bear",
  neutral: "border-primary/40 bg-primary/10 text-primary",
} as const;

function useForecast(symbol: string, horizon: number | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["forecast", symbol, horizon],
    queryFn: async () => {
      const res = await axios.get<{ ok: boolean; data: ForecastResult }>(
        `/api/forecast/${encodeURIComponent(symbol)}?horizon=${horizon}`
      );
      return res.data.data;
    },
    enabled: enabled && horizon !== undefined,
    staleTime: 10 * 60 * 1000,
    retry: 0,
  });
}

export function PriceChart({ symbol }: { symbol: string }) {
  const [rangeIdx, setRangeIdx] = useState(4); // default 1Y
  const [showForecast, setShowForecast] = useState(true);
  const { range, interval, horizon } = RANGES[rangeIdx];
  const { data, isLoading } = useChart(symbol, range, interval);
  const { data: forecast } = useForecast(symbol, horizon, showForecast);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !data || data.candles.length === 0) return;

    const istTime = (t: number) =>
      new Date(t * 1000).toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    const intradayInterval = interval !== "1d" && interval !== "1wk" && interval !== "1mo";
    const chart = createChart(el, {
      autoSize: true,
      localization: intradayInterval ? { timeFormatter: (t: number) => `${istTime(t)} IST` } : {},
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#5b6b82",
        fontFamily: "var(--font-plex-mono), monospace",
        fontSize: 10,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(100,116,139,0.14)" },
        horzLines: { color: "rgba(100,116,139,0.14)" },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: {
        borderVisible: false,
        timeVisible: intradayInterval,
        ...(intradayInterval ? { tickMarkFormatter: (t: number) => istTime(t) } : {}),
      },
      crosshair: { mode: 0 },
    });
    chartRef.current = chart;

    const candles = chart.addSeries(CandlestickSeries, {
      upColor: "#0e9f6e",
      downColor: "#dc3d43",
      borderVisible: false,
      wickUpColor: "#0e9f6e",
      wickDownColor: "#dc3d43",
    });
    candles.setData(
      data.candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    const hasVolume = data.candles.some((c) => (c.volume ?? 0) > 0);
    if (hasVolume) {
      const volume = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });
      chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
      volume.setData(
        data.candles.map((c) => ({
          time: c.time as UTCTimestamp,
          value: c.volume ?? 0,
          color: c.close >= c.open ? "rgba(14,159,110,0.35)" : "rgba(220,61,67,0.35)",
        }))
      );
    }

    if (showForecast && forecast && horizon) {
      const lastReal = data.candles[data.candles.length - 1];

      // Pattern helper trendlines (support / resistance).
      const drawLine = (
        ln: { p1: { time: number; price: number }; p2: { time: number; price: number } } | undefined,
        color: string
      ) => {
        if (!ln) return;
        const s = chart.addSeries(LineSeries, {
          color,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        s.setData([
          { time: ln.p1.time as UTCTimestamp, value: ln.p1.price },
          { time: ln.p2.time as UTCTimestamp, value: ln.p2.price },
        ]);
      };
      drawLine(forecast.shape?.resistance, "rgba(220,61,67,0.55)");
      drawLine(forecast.shape?.support, "rgba(14,159,110,0.55)");

      // Projection: base / bull / bear glide paths.
      const anchor = (v: number) => ({ time: lastReal.time as UTCTimestamp, value: v });
      const paths: Array<[keyof typeof forecast.projection[0], string, LineStyle]> = [
        ["bull", "rgba(14,159,110,0.5)", LineStyle.Dotted],
        ["base", "rgba(176,125,24,0.85)", LineStyle.Dashed],
        ["bear", "rgba(220,61,67,0.5)", LineStyle.Dotted],
      ];
      for (const [key, color, style] of paths) {
        const s = chart.addSeries(LineSeries, {
          color,
          lineWidth: key === "base" ? 2 : 1,
          lineStyle: style,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        s.setData([
          anchor(lastReal.close),
          ...forecast.projection.map((p) => ({ time: p.time as UTCTimestamp, value: p[key] as number })),
        ]);
      }

      // Target price lines with axis labels.
      const targets: Array<[number, string, string]> = [
        [forecast.bullTarget, "rgba(14,159,110,0.9)", "BULL"],
        [forecast.baseTarget, "rgba(176,125,24,0.95)", "BASE"],
        [forecast.bearTarget, "rgba(220,61,67,0.9)", "BEAR"],
      ];
      for (const [price, color, title] of targets) {
        candles.createPriceLine({ price, color, lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title });
      }
    }

    chart.timeScale().fitContent();
    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [data, interval, forecast, showForecast, horizon]);

  const shape = forecast?.shape;

  return (
    <Panel
      code="CHRT"
      title="Price, Volume & Pattern"
      right={
        <div className="flex items-center gap-0.5">
          {horizon !== undefined && (
            <button
              onClick={() => setShowForecast(!showForecast)}
              className={cn(
                "num mr-1 cursor-pointer rounded-sm border px-1.5 py-0.5 text-[10px] transition-colors",
                showForecast
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              PROJECTION
            </button>
          )}
          {RANGES.map((r, i) => (
            <button
              key={r.label}
              onClick={() => setRangeIdx(i)}
              className={cn(
                "num cursor-pointer rounded-sm px-1.5 py-0.5 text-[10px] transition-colors",
                i === rangeIdx ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      }
    >
      {isLoading ? (
        <Skeleton className="m-2 h-[380px]" />
      ) : data && data.candles.length > 0 ? (
        <>
          <div ref={containerRef} className="h-[400px] w-full" />
          {showForecast && forecast && horizon !== undefined && (
            <div className="space-y-2 border-t border-border/60 p-2.5">
              {/* Shape box + targets */}
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1.2fr_1fr]">
                {shape && (
                  <div className={cn("rounded-sm border p-2", SIGNAL_STYLES[shape.signal])}>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-semibold uppercase tracking-widest opacity-70">
                        Chart Shape
                      </span>
                      <span className="text-sm font-semibold">{shape.shape}</span>
                      <span className="num rounded-[2px] border border-current/30 px-1 text-[9px] uppercase opacity-80">
                        {shape.confidence} confidence
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-foreground/85">{shape.expectation}</p>
                    <p className="num mt-0.5 text-[9px] leading-snug opacity-70">{shape.description}</p>
                  </div>
                )}

                <div className="num grid grid-cols-3 gap-1.5 rounded-sm border border-border bg-background/50 p-2 text-center">
                  <Target label="Bear" price={forecast.bearTarget} pct={forecast.bearPct} tone="bear" />
                  <Target label="Base" price={forecast.baseTarget} pct={forecast.basePct} tone="base" />
                  <Target label="Bull" price={forecast.bullTarget} pct={forecast.bullPct} tone="bull" />
                </div>
              </div>

              {/* Indicator pattern chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Signals
                </span>
                {forecast.patterns.map((p) => (
                  <span
                    key={p.name}
                    title={p.detail}
                    className={cn("cursor-help rounded-sm border px-1.5 py-0.5 text-[10px]", SIGNAL_STYLES[p.signal])}
                  >
                    {p.name}
                  </span>
                ))}
              </div>

              {/* Plain explanation + per-model views */}
              <p className="text-[11px] leading-relaxed text-foreground/85">{forecast.summary}</p>
              {forecast.modelViews.length > 0 && (
                <div className="grid grid-cols-1 gap-1.5 border-t border-border/60 pt-1.5 md:grid-cols-2">
                  {forecast.modelViews.map((m) => (
                    <div key={m.model} className="text-[10px] leading-snug">
                      <span className="num font-semibold text-primary">{shortModel(m.model)}</span>{" "}
                      <span className="num text-muted-foreground">
                        (base {m.baseReturnPct >= 0 ? "+" : ""}
                        {m.baseReturnPct.toFixed(1)}%, conf {Math.round(m.confidence * 100)}%)
                      </span>
                      <div className="text-muted-foreground">{m.note}</div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[9px] leading-snug text-muted-foreground">
                {forecast.source === "ensemble"
                  ? "Projection blends two AI models with the detected pattern."
                  : forecast.source === "free"
                    ? "Projection from a single AI model (paid budget spent)."
                    : "Projection from a momentum model (AI unavailable)."}{" "}
                Targets are a horizon view for orientation, not a guarantee. Not investment advice.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="flex h-[380px] items-center justify-center text-xs text-muted-foreground">
          No chart data for this range.
        </div>
      )}
    </Panel>
  );
}

function Target({
  label,
  price,
  pct,
  tone,
}: {
  label: string;
  price: number;
  pct: number;
  tone: "bull" | "bear" | "base";
}) {
  const color = tone === "bull" ? "text-bull" : tone === "bear" ? "text-bear" : "text-primary";
  return (
    <div>
      <div className="text-[8.5px] uppercase tracking-wider text-muted-foreground">{label} target</div>
      <div className={cn("text-[13px] font-semibold", color)}>₹{fmt(price)}</div>
      <div className={cn("text-[9px]", color)}>
        {pct >= 0 ? "+" : ""}
        {pct.toFixed(1)}%
      </div>
    </div>
  );
}

function shortModel(model: string): string {
  if (model.includes("deepseek")) return "DeepSeek";
  if (model.includes("gpt-4o")) return "GPT-4o-mini";
  if (model.includes("gpt-oss")) return "GPT-OSS (free)";
  return model.split("/").pop() ?? model;
}
