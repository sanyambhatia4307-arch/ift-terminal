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
  neutral: "border-border bg-secondary/40 text-muted-foreground",
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
      localization: intradayInterval
        ? { timeFormatter: (t: number) => `${istTime(t)} IST` }
        : {},
      layout: {
        // lightweight-charts cannot parse oklch()/lab() CSS variables — hex only.
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
        ...(intradayInterval
          ? { tickMarkFormatter: (t: number) => istTime(t) }
          : {}),
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
      chart.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.82, bottom: 0 },
      });
      volume.setData(
        data.candles.map((c) => ({
          time: c.time as UTCTimestamp,
          value: c.volume ?? 0,
          color:
            c.close >= c.open ? "rgba(14,159,110,0.35)" : "rgba(220,61,67,0.35)",
        }))
      );
    }

    // Forward projection — drawn lighter, anchored to the last real close.
    if (showForecast && forecast && forecast.projection.length > 0 && horizon) {
      const lastReal = data.candles[data.candles.length - 1];
      const anchor = { time: lastReal.time as UTCTimestamp, value: lastReal.close };
      const mid = chart.addSeries(LineSeries, {
        color: "rgba(176,125,24,0.65)",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        title: "projection",
        priceLineVisible: false,
        crosshairMarkerVisible: false,
      });
      mid.setData([
        anchor,
        ...forecast.projection.map((p) => ({ time: p.time as UTCTimestamp, value: p.mid })),
      ]);
      for (const key of ["upper", "lower"] as const) {
        const band = chart.addSeries(LineSeries, {
          color: "rgba(100,116,139,0.35)",
          lineWidth: 1,
          lineStyle: LineStyle.SparseDotted,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
        });
        band.setData([
          anchor,
          ...forecast.projection.map((p) => ({ time: p.time as UTCTimestamp, value: p[key] })),
        ]);
      }
    }

    chart.timeScale().fitContent();
    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [data, interval, forecast, showForecast, horizon]);

  return (
    <Panel
      code="CHRT"
      title="Price & Volume"
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
                i === rangeIdx
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
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
            <div className="border-t border-border/60 px-2.5 py-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Pattern read
                </span>
                {forecast.patterns.map((p) => (
                  <span
                    key={p.name}
                    title={p.detail}
                    className={cn(
                      "cursor-help rounded-sm border px-1.5 py-0.5 text-[10px]",
                      SIGNAL_STYLES[p.signal]
                    )}
                  >
                    {p.name}
                  </span>
                ))}
              </div>
              <p className="num mt-1 text-[9px] leading-snug text-muted-foreground">
                Dashed cone = {forecast.horizonDays}-session statistical projection (momentum{" "}
                {forecast.driftDailyPct >= 0 ? "+" : ""}
                {forecast.driftDailyPct}%/day blended with news sentiment{" "}
                {forecast.sentimentScore >= 0 ? "+" : ""}
                {forecast.sentimentScore} and street targets, ±1σ band). Orientation, not a
                prediction.
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
