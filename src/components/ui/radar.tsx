"use client";

export interface RadarSeries {
  label: string;
  color: string;
  values: number[]; // 0..100, aligned to axes
}

/** Multi-series radar (spider) chart on a 0 to 100 scale. */
export function Radar({
  axes,
  series,
  size = 240,
}: {
  axes: string[];
  series: RadarSeries[];
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 34;
  const n = axes.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, v: number) => {
    const rad = (v / 100) * r;
    return [cx + rad * Math.cos(angle(i)), cy + rad * Math.sin(angle(i))];
  };
  const rings = [25, 50, 75, 100];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto block w-full max-w-[260px]">
      {/* grid rings */}
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={axes
            .map((_, i) => point(i, ring).join(","))
            .join(" ")}
          fill="none"
          stroke="var(--border)"
          strokeWidth="0.6"
        />
      ))}
      {/* spokes + labels */}
      {axes.map((ax, i) => {
        const [x, y] = point(i, 100);
        const [lx, ly] = point(i, 122);
        return (
          <g key={ax}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth="0.6" />
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="8.5"
              fill="var(--muted-foreground)"
            >
              {ax}
            </text>
          </g>
        );
      })}
      {/* series polygons */}
      {series.map((s) => {
        const pts = s.values.map((v, i) => point(i, v).join(",")).join(" ");
        return (
          <g key={s.label}>
            <polygon
              points={pts}
              fill={s.color}
              fillOpacity="0.12"
              stroke={s.color}
              strokeWidth="1.5"
              style={{ transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)" }}
            />
            {s.values.map((v, i) => {
              const [x, y] = point(i, v);
              return <circle key={i} cx={x} cy={y} r="2" fill={s.color} />;
            })}
          </g>
        );
      })}
    </svg>
  );
}
