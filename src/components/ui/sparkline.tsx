"use client";

import type { Candle } from "@/types/market";

/** Tiny inline SVG price sparkline with a soft fill, colored by direction. */
export function Sparkline({
  candles,
  baseline,
  width = 120,
  height = 26,
}: {
  candles: Candle[];
  baseline?: number; // previous close · colors relative to it
  width?: number;
  height?: number;
}) {
  if (candles.length < 2) return null;
  const closes = candles.map((c) => c.close);
  const min = Math.min(...closes, baseline ?? Infinity);
  const max = Math.max(...closes, baseline ?? -Infinity);
  const span = max - min || 1;
  const x = (i: number) => (i / (closes.length - 1)) * width;
  const y = (v: number) => height - ((v - min) / span) * (height - 2) - 1;

  const path = closes.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const ref = baseline ?? closes[0];
  const up = closes[closes.length - 1] >= ref;
  const color = up ? "var(--bull)" : "var(--bear)";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-[26px] w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      {baseline !== undefined && (
        <line
          x1="0"
          x2={width}
          y1={y(baseline)}
          y2={y(baseline)}
          stroke="var(--flat)"
          strokeOpacity="0.35"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      )}
      <path
        d={`${path} L${width},${height} L0,${height} Z`}
        fill={color}
        fillOpacity="0.1"
        stroke="none"
      />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
