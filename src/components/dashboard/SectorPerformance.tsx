"use client";

import Link from "next/link";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useIndices } from "@/hooks/queries";
import { fmtPct } from "@/lib/format";
import { cn } from "@/lib/utils";

// NSE sector index → app symbol that opens its constituents/research view.
const SECTOR_LINK: Record<string, string> = {
  "NIFTY BANK": "NIFTY BANK",
  "NIFTY IT": "NIFTY IT",
  "NIFTY AUTO": "NIFTY AUTO",
  "NIFTY PHARMA": "NIFTY PHARMA",
  "NIFTY FMCG": "NIFTY FMCG",
  "NIFTY METAL": "NIFTY METAL",
  "NIFTY REALTY": "NIFTY REALTY",
  "NIFTY ENERGY": "NIFTY ENERGY",
  "NIFTY FIN SERVICE": "NIFTY FIN SERVICE",
  "NIFTY PSU BANK": "NIFTY PSU BANK",
  "NIFTY MEDIA": "NIFTY MEDIA",
  "NIFTY PVT BANK": "NIFTY PVT BANK",
};

export function SectorPerformance({ className }: { className?: string }) {
  const { data, isLoading } = useIndices();

  const rows = (data?.sectors ?? [])
    .map((s) => ({
      raw: s.name,
      name: s.name.replace(/^NIFTY /, ""),
      change: s.changePercent,
    }))
    .sort((a, b) => b.change - a.change);

  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.change)), 0.5);
  const advancing = rows.filter((r) => r.change > 0).length;

  return (
    <Panel
      code="SECT"
      title="Sector Performance · 1D"
      className={className ?? "h-full"}
      right={
        rows.length > 0 ? (
          <span className="num text-[10px] text-muted-foreground">
            <span className="text-bull">{advancing}</span>
            <span className="mx-0.5">/</span>
            <span className="text-bear">{rows.length - advancing}</span> up
          </span>
        ) : null
      }
    >
      {isLoading ? (
        <Skeleton className="m-2 h-64" />
      ) : (
        <div className="flex h-full min-h-[300px] flex-col gap-px p-1.5">
          {rows.map((row) => {
            const up = row.change >= 0;
            const widthPct = (Math.abs(row.change) / maxAbs) * 50;
            const href = SECTOR_LINK[row.raw];
            const body = (
              <>
                <span className="w-[88px] shrink-0 truncate text-right text-[10px] font-medium text-muted-foreground group-hover:text-foreground">
                  {row.name}
                </span>
                <div className="relative h-full min-h-[16px] flex-1">
                  {/* zero baseline */}
                  <span className="absolute left-1/2 top-0 h-full w-px bg-border" />
                  {/* diverging bar */}
                  <span
                    className={cn(
                      "absolute top-1/2 h-[60%] -translate-y-1/2 rounded-[2px]",
                      up ? "left-1/2" : "right-1/2"
                    )}
                    style={{
                      width: `${widthPct}%`,
                      minWidth: "2px",
                      background: up
                        ? "linear-gradient(90deg, color-mix(in oklab, var(--bull) 50%, transparent), var(--bull))"
                        : "linear-gradient(270deg, color-mix(in oklab, var(--bear) 50%, transparent), var(--bear))",
                    }}
                  />
                </div>
                <span
                  className={cn(
                    "num w-14 shrink-0 text-right text-[10px] font-medium tabular-nums",
                    up ? "text-bull" : "text-bear"
                  )}
                >
                  {fmtPct(row.change)}
                </span>
              </>
            );
            return href ? (
              <Link
                key={row.raw}
                href={`/stock/${encodeURIComponent(href)}`}
                className="group flex flex-1 cursor-pointer items-center gap-2 rounded-sm px-1 transition-colors duration-150 hover:bg-accent/50"
              >
                {body}
              </Link>
            ) : (
              <div key={row.raw} className="group flex flex-1 items-center gap-2 px-1">
                {body}
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
