"use client";

import {
  CandlestickSeries,
  ColorType,
  createChart,
  LineStyle,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef } from "react";
import type { IntradayAnalysis } from "@/lib/analysis/intraday-types";

const LEVEL_STYLES: Array<{
  key: keyof IntradayAnalysis["levels"];
  title: string;
  color: string;
  style: LineStyle;
}> = [
  { key: "r3", title: "R3", color: "#dc3d43", style: LineStyle.SparseDotted },
  { key: "r2", title: "R2", color: "#dc3d43", style: LineStyle.Dotted },
  { key: "r1", title: "R1", color: "#dc3d43", style: LineStyle.Dashed },
  { key: "tc", title: "CPR TC", color: "#b07d18", style: LineStyle.Solid },
  { key: "pivot", title: "PIVOT", color: "#b07d18", style: LineStyle.LargeDashed },
  { key: "bc", title: "CPR BC", color: "#b07d18", style: LineStyle.Solid },
  { key: "s1", title: "S1", color: "#0e9f6e", style: LineStyle.Dashed },
  { key: "s2", title: "S2", color: "#0e9f6e", style: LineStyle.Dotted },
  { key: "s3", title: "S3", color: "#0e9f6e", style: LineStyle.SparseDotted },
  { key: "orHigh", title: "OR-H", color: "#3b6fd4", style: LineStyle.Dotted },
  { key: "orLow", title: "OR-L", color: "#3b6fd4", style: LineStyle.Dotted },
];

const istTime = (time: number) =>
  new Date(time * 1000).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

export function IntradayChart({ analysis }: { analysis: IntradayAnalysis }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || analysis.candles.length === 0) return;

    const chart = createChart(el, {
      localization: {
        timeFormatter: (t: number) => `${istTime(t)} IST`,
      },
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#5b6b82",
        fontFamily: "var(--font-plex-mono), monospace",
        fontSize: 10,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(100,116,139,0.12)" },
        horzLines: { color: "rgba(100,116,139,0.12)" },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (t: number) => istTime(t),
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#0e9f6e",
      downColor: "#dc3d43",
      borderVisible: false,
      wickUpColor: "#0e9f6e",
      wickDownColor: "#dc3d43",
    });
    series.setData(
      analysis.candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    for (const lvl of LEVEL_STYLES) {
      const price = analysis.levels[lvl.key];
      if (price === undefined) continue;
      series.createPriceLine({
        price,
        color: lvl.color,
        lineWidth: 1,
        lineStyle: lvl.style,
        axisLabelVisible: true,
        title: lvl.title,
      });
    }

    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [analysis]);

  return <div ref={containerRef} className="h-[440px] w-full" />;
}
