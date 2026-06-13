"use client";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

/** SVG donut chart with center label and a legend. */
export function Donut({
  segments,
  size = 132,
  thickness = 16,
  centerTop,
  centerSub,
}: {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerTop?: string;
  centerSub?: string;
}) {
  const total = segments.reduce((a, s) => a + Math.max(0, s.value), 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }} className="-rotate-90 shrink-0">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={thickness} />
        {segments.map((s) => {
          const frac = Math.max(0, s.value) / total;
          const dash = frac * c;
          const seg = (
            <circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.16,1,0.3,1)" }}
            />
          );
          offset += dash;
          return seg;
        })}
        {centerTop && (
          <text
            x={size / 2}
            y={size / 2 - 2}
            textAnchor="middle"
            className="num rotate-90"
            transform={`rotate(90 ${size / 2} ${size / 2})`}
            fontSize="16"
            fontWeight="600"
            fill="var(--foreground)"
          >
            {centerTop}
          </text>
        )}
        {centerSub && (
          <text
            x={size / 2}
            y={size / 2 + 12}
            textAnchor="middle"
            transform={`rotate(90 ${size / 2} ${size / 2})`}
            fontSize="8"
            fill="var(--muted-foreground)"
            letterSpacing="1"
          >
            {centerSub}
          </text>
        )}
      </svg>
      <div className="min-w-0 space-y-1">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-[11px]">
            <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: s.color }} />
            <span className="truncate text-muted-foreground">{s.label}</span>
            <span className="num ml-auto pl-2 font-medium">
              {((Math.max(0, s.value) / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
