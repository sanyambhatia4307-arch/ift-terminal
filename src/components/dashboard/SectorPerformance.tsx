"use client";

import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useIndices } from "@/hooks/queries";

export function SectorPerformance({ className }: { className?: string }) {
  const { data, isLoading } = useIndices();

  const rows = (data?.sectors ?? [])
    .map((s) => ({
      name: s.name.replace(/^NIFTY /, ""),
      change: s.changePercent,
    }))
    .sort((a, b) => b.change - a.change);

  return (
    <Panel code="SECT" title="Sector Performance (1D)" className={className ?? "h-full"}>
      {isLoading ? (
        <Skeleton className="m-2 h-64" />
      ) : (
        <div className="h-full min-h-[280px] p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickFormatter={(v: number) => `${v}%`}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={84}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "var(--accent)" }}
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  fontSize: 11,
                }}
                formatter={(v) => [`${Number(v).toFixed(2)}%`, "1D change"]}
              />
              <ReferenceLine x={0} stroke="var(--border)" />
              <Bar dataKey="change" radius={[0, 2, 2, 0]} barSize={12}>
                {rows.map((row) => (
                  <Cell
                    key={row.name}
                    fill={row.change >= 0 ? "var(--bull)" : "var(--bear)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}
