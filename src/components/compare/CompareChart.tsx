"use client";

import {
  ColorType,
  createChart,
  LineSeries,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef } from "react";
import type { ChartResult } from "@/types/market";

export const COMPARE_COLORS = ["#e0a93f", "#22c08a", "#7aa2f7", "#e8484f"];

/** Multi-symbol chart, each series rebased to 100 at the first shared bar. */
export function CompareChart({ charts }: { charts: Array<{ symbol: string; data: ChartResult }> }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || charts.length === 0) return;

    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#8593a8",
        fontFamily: "var(--font-plex-mono), monospace",
        fontSize: 10,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(120,130,150,0.06)" },
        horzLines: { color: "rgba(120,130,150,0.06)" },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
      localization: {
        priceFormatter: (v: number) => v.toFixed(0),
      },
    });

    charts.forEach(({ symbol, data }, i) => {
      const candles = data.candles;
      if (candles.length === 0) return;
      const base = candles[0].close;
      const series = chart.addSeries(LineSeries, {
        color: COMPARE_COLORS[i % COMPARE_COLORS.length],
        lineWidth: 2,
        title: symbol,
        priceLineVisible: false,
      });
      series.setData(
        candles.map((c) => ({
          time: c.time as UTCTimestamp,
          value: (c.close / base) * 100,
        }))
      );
    });

    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [charts]);

  return <div ref={containerRef} className="h-[360px] w-full" />;
}
