"use client";

import {
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  type IChartApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useChart } from "@/hooks/queries";
import { cn } from "@/lib/utils";

const RANGES: Array<{ label: string; range: string; interval: string }> = [
  { label: "1D", range: "1d", interval: "5m" },
  { label: "5D", range: "5d", interval: "15m" },
  { label: "1M", range: "1mo", interval: "1h" },
  { label: "6M", range: "6mo", interval: "1d" },
  { label: "1Y", range: "1y", interval: "1d" },
  { label: "5Y", range: "5y", interval: "1wk" },
  { label: "MAX", range: "max", interval: "1mo" },
];

export function PriceChart({ symbol }: { symbol: string }) {
  const [rangeIdx, setRangeIdx] = useState(4); // default 1Y
  const { range, interval } = RANGES[rangeIdx];
  const { data, isLoading } = useChart(symbol, range, interval);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !data || data.candles.length === 0) return;

    const styles = getComputedStyle(document.documentElement);
    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: styles.getPropertyValue("--muted-foreground").trim() || "#8593a8",
        fontFamily: "var(--font-plex-mono), monospace",
        fontSize: 10,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(120,130,150,0.08)" },
        horzLines: { color: "rgba(120,130,150,0.08)" },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: interval !== "1d" },
      crosshair: { mode: 0 },
    });
    chartRef.current = chart;

    const candles = chart.addSeries(CandlestickSeries, {
      upColor: "#22c08a",
      downColor: "#e8484f",
      borderVisible: false,
      wickUpColor: "#22c08a",
      wickDownColor: "#e8484f",
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
            c.close >= c.open ? "rgba(34,192,138,0.35)" : "rgba(232,72,79,0.35)",
        }))
      );
    }

    chart.timeScale().fitContent();
    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [data, interval]);

  return (
    <Panel
      title="Price & Volume"
      right={
        <div className="flex gap-0.5">
          {RANGES.map((r, i) => (
            <button
              key={r.label}
              onClick={() => setRangeIdx(i)}
              className={cn(
                "num rounded-sm px-1.5 py-0.5 text-[10px] transition-colors",
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
        <div ref={containerRef} className="h-[400px] w-full" />
      ) : (
        <div className="flex h-[380px] items-center justify-center text-xs text-muted-foreground">
          No chart data for this range.
        </div>
      )}
    </Panel>
  );
}
