"use client";

import {
  CandlestickSeries,
  ColorType,
  createChart,
  createSeriesMarkers,
  LineStyle,
  type SeriesMarker,
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
  { key: "r3", title: "R3", color: "#f4606a", style: LineStyle.SparseDotted },
  { key: "r2", title: "R2", color: "#f4606a", style: LineStyle.Dotted },
  { key: "r1", title: "R1", color: "#f4606a", style: LineStyle.Dashed },
  { key: "tc", title: "CPR TC", color: "#e0a93a", style: LineStyle.Solid },
  { key: "pivot", title: "PIVOT", color: "#e0a93a", style: LineStyle.LargeDashed },
  { key: "bc", title: "CPR BC", color: "#e0a93a", style: LineStyle.Solid },
  { key: "s1", title: "S1", color: "#26d98a", style: LineStyle.Dashed },
  { key: "s2", title: "S2", color: "#26d98a", style: LineStyle.Dotted },
  { key: "s3", title: "S3", color: "#26d98a", style: LineStyle.SparseDotted },
  { key: "orHigh", title: "OR-H", color: "#5b8def", style: LineStyle.Dotted },
  { key: "orLow", title: "OR-L", color: "#5b8def", style: LineStyle.Dotted },
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
        textColor: "#8b9bb5",
        fontFamily: "var(--font-plex-mono), monospace",
        fontSize: 10,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(148,163,184,0.08)" },
        horzLines: { color: "rgba(148,163,184,0.08)" },
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
      upColor: "#26d98a",
      downColor: "#f4606a",
      borderVisible: false,
      wickUpColor: "#26d98a",
      wickDownColor: "#f4606a",
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

    // Trade-plan overlay · the actionable breakout, drawn bold over the levels.
    const plan = analysis.plan;
    const markers: SeriesMarker<UTCTimestamp>[] = [];
    if (plan.direction !== "WAIT") {
      const long = plan.direction === "LONG";
      const entryColor = "#e0a93a";
      const stopColor = "#f4606a";
      const tgtColor = "#26d98a";
      const planLines: Array<[number, string, string, number]> = [
        [plan.entry, entryColor, long ? "ENTRY ▲" : "ENTRY ▼", 2],
        [plan.stop, stopColor, "STOP", 2],
        [plan.target1, tgtColor, "T1", 1],
        [plan.target2, tgtColor, "T2", 1],
      ];
      for (const [price, color, title, width] of planLines) {
        series.createPriceLine({
          price,
          color,
          lineWidth: width as 1 | 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title,
        });
      }
      const lastBar = analysis.candles[analysis.candles.length - 1];
      markers.push({
        time: lastBar.time as UTCTimestamp,
        position: long ? "belowBar" : "aboveBar",
        color: long ? tgtColor : stopColor,
        shape: long ? "arrowUp" : "arrowDown",
        text: long ? "LONG ▲" : "SHORT ▼",
      });
    }
    if (markers.length) createSeriesMarkers(series, markers);

    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [analysis]);

  return <div ref={containerRef} className="h-[440px] w-full" />;
}
