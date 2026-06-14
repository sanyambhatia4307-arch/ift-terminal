"use client";

import { Layers } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useOptionChain } from "@/hooks/queries";
import { fmt, fmtVolume } from "@/lib/format";
import { cn } from "@/lib/utils";

function pcrRead(pcr: number): { label: string; tone: string } {
  if (pcr >= 1.3) return { label: "put-heavy · support below", tone: "text-bull" };
  if (pcr <= 0.75) return { label: "call-heavy · resistance above", tone: "text-bear" };
  return { label: "balanced", tone: "text-muted-foreground" };
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="rounded-sm border border-border bg-background/40 px-2 py-1.5">
      <div className="text-[8.5px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("num text-sm font-semibold leading-tight", tone ?? "text-foreground")}>{value}</div>
      {sub && <div className="num text-[9px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function OptionsPanel({ symbol }: { symbol: string }) {
  const { data, isLoading, isError } = useOptionChain(symbol);

  const maxOI = data?.rows.length
    ? Math.max(...data.rows.flatMap((r) => [r.ceOI ?? 0, r.peOI ?? 0]))
    : 0;
  const atm = data?.underlying;

  return (
    <Panel
      code="OPTS"
      title={
        <span className="flex items-center gap-1.5">
          <Layers className="h-3 w-3" /> Options / OI
          {data?.expiry ? <span className="text-muted-foreground">· {data.expiry}</span> : null}
        </span>
      }
    >
      {isLoading ? (
        <Skeleton className="m-2 h-56" />
      ) : isError || !data || data.rows.length === 0 ? (
        <div className="p-4 text-xs text-muted-foreground">
          Option chain unavailable for this instrument (NSE index options only; SENSEX trades on BSE).
        </div>
      ) : (
        <div className="space-y-2 p-2.5">
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            <Stat
              label="PCR (OI)"
              value={data.pcr != null ? data.pcr.toFixed(2) : "—"}
              sub={data.pcr != null ? pcrRead(data.pcr).label : undefined}
              tone={data.pcr != null ? pcrRead(data.pcr).tone : undefined}
            />
            <Stat label="Max pain" value={data.maxPain != null ? fmt(data.maxPain, 0) : "—"} sub={atm ? `spot ${fmt(atm, 0)}` : undefined} tone="text-primary" />
            <Stat label="Support (PE wall)" value={data.support != null ? fmt(data.support, 0) : "—"} sub="most put OI" tone="text-bull" />
            <Stat label="Resistance (CE wall)" value={data.resistance != null ? fmt(data.resistance, 0) : "—"} sub="most call OI" tone="text-bear" />
          </div>

          {/* OI distribution · puts left (green), calls right (red) */}
          <div>
            <div className="mb-1 flex items-center justify-between text-[8.5px] uppercase tracking-wider text-muted-foreground">
              <span className="text-bull">Put OI</span>
              <span>Strike</span>
              <span className="text-bear">Call OI</span>
            </div>
            <div className="space-y-px">
              {data.rows.map((r) => {
                const isATM = atm != null && data.rows.every((o) => Math.abs(o.strike - atm) >= Math.abs(r.strike - atm));
                const pePct = maxOI > 0 ? ((r.peOI ?? 0) / maxOI) * 100 : 0;
                const cePct = maxOI > 0 ? ((r.ceOI ?? 0) / maxOI) * 100 : 0;
                return (
                  <div key={r.strike} className="flex items-center gap-1 text-[10px]">
                    <div className="flex h-3.5 flex-1 items-center justify-end">
                      <span className="num mr-1 text-[9px] text-muted-foreground">{r.peOI ? fmtVolume(r.peOI) : ""}</span>
                      <span className="h-2.5 rounded-l-sm bg-bull/60" style={{ width: `${pePct}%` }} />
                    </div>
                    <span
                      className={cn(
                        "num w-14 shrink-0 text-center",
                        r.strike === data.support && "text-bull font-semibold",
                        r.strike === data.resistance && "text-bear font-semibold",
                        isATM && "rounded-sm bg-accent/60"
                      )}
                    >
                      {fmt(r.strike, 0)}
                    </span>
                    <div className="flex h-3.5 flex-1 items-center">
                      <span className="h-2.5 rounded-r-sm bg-bear/60" style={{ width: `${cePct}%` }} />
                      <span className="num ml-1 text-[9px] text-muted-foreground">{r.ceOI ? fmtVolume(r.ceOI) : ""}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-[9px] leading-snug text-muted-foreground">
            Nearest weekly expiry · {fmtVolume(data.totalPutOI)} put vs {fmtVolume(data.totalCallOI)} call OI.
            High call OI = an upside wall (resistance); high put OI = a downside floor (support); price often
            gravitates toward max pain into expiry. NSE, ~90s refresh.
          </p>
        </div>
      )}
    </Panel>
  );
}
