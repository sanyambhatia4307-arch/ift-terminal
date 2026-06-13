"use client";

/**
 * Semicircular advancers/decliners gauge · a fear/greed-style needle.
 * t = advancers / total, mapped across a 180° arc (red → amber → green).
 */
export function BreadthGauge({
  advancing,
  declining,
  unchanged = 0,
}: {
  advancing: number;
  declining: number;
  unchanged?: number;
}) {
  const total = advancing + declining + unchanged || 1;
  const t = advancing / total; // 0..1
  const arcLen = Math.PI * 80; // semicircle radius 80
  const angle = Math.PI * (1 - t); // 180°→0°
  const needleX = 100 + 70 * Math.cos(angle);
  const needleY = 100 - 70 * Math.sin(angle);
  const pct = Math.round(t * 100);
  const mood =
    pct >= 66 ? "Risk-on" : pct >= 55 ? "Constructive" : pct >= 45 ? "Mixed" : pct >= 33 ? "Cautious" : "Risk-off";
  const moodColor = pct >= 55 ? "var(--bull)" : pct >= 45 ? "var(--primary)" : "var(--bear)";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 116" className="w-full max-w-[220px]">
        <defs>
          <linearGradient id="breadth-arc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--bear)" />
            <stop offset="50%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--bull)" />
          </linearGradient>
        </defs>
        {/* track */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="var(--muted)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* fill up to t */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#breadth-arc)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${t * arcLen} ${arcLen}`}
          style={{ transition: "stroke-dasharray 0.9s cubic-bezier(0.16,1,0.3,1)" }}
        />
        {/* needle */}
        <line
          x1="100"
          y1="100"
          x2={needleX}
          y2={needleY}
          stroke={moodColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ transition: "all 0.9s cubic-bezier(0.16,1,0.3,1)" }}
        />
        <circle cx="100" cy="100" r="5" fill={moodColor} />
        <text x="100" y="78" textAnchor="middle" className="num" fontSize="22" fontWeight="600" fill="var(--foreground)">
          {pct}%
        </text>
        <text x="100" y="94" textAnchor="middle" fontSize="8" fill="var(--muted-foreground)" letterSpacing="1">
          ADVANCING
        </text>
      </svg>
      <div className="num -mt-1 text-[11px] font-semibold" style={{ color: moodColor }}>
        {mood}
      </div>
      <div className="num mt-0.5 flex gap-3 text-[10px]">
        <span className="text-bull">▲ {advancing}</span>
        <span className="text-muted-foreground">● {unchanged}</span>
        <span className="text-bear">▼ {declining}</span>
      </div>
    </div>
  );
}
