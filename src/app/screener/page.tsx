"use client";

import { Filter, SlidersHorizontal, Telescope } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { StatBand, StatTile } from "@/components/ui/stat-tile";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useScreener } from "@/hooks/queries";
import { changeClass, fmt, fmtInrCompact, fmtPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ScreenerRow } from "@/lib/screener";

type Filters = {
  mcapMinCr?: number;
  peMax?: number;
  pbMax?: number;
  roeMin?: number;
  revGrowthMin?: number;
  epsGrowthMin?: number;
  deMax?: number;
  momentumOnly?: boolean;
  sector?: string;
};

type SortKey = keyof ScreenerRow;

const PRESETS: Array<{ label: string; desc: string; filters: Filters; sort: SortKey }> = [
  { label: "All names", desc: "Whole universe, ranked by overall score", filters: {}, sort: "composite" },
  {
    label: "Quality compounders",
    desc: "ROE ≥ 15%, low debt, growing earnings",
    filters: { roeMin: 15, deMax: 0.6, epsGrowthMin: 8 },
    sort: "qualityScore",
  },
  {
    label: "Value",
    desc: "P/E ≤ 20 and P/B ≤ 3",
    filters: { peMax: 20, pbMax: 3 },
    sort: "valueScore",
  },
  {
    label: "Growth leaders",
    desc: "Revenue & EPS growth ≥ 12%",
    filters: { revGrowthMin: 12, epsGrowthMin: 12 },
    sort: "growthScore",
  },
  {
    label: "Momentum",
    desc: "Above 200-DMA and near 52-wk highs",
    filters: { momentumOnly: true },
    sort: "momentumScore",
  },
  {
    label: "Low debt, high ROE",
    desc: "D/E ≤ 0.5x and ROE ≥ 15%",
    filters: { deMax: 0.5, roeMin: 15 },
    sort: "qualityScore",
  },
];

function scoreClass(n: number | undefined): string {
  if (n == null) return "text-muted-foreground/50";
  if (n >= 66) return "text-bull";
  if (n >= 45) return "text-primary";
  return "text-bear";
}

const num = (v: number | undefined, digits = 1) => (v == null ? "—" : v.toFixed(digits));

function median(xs: number[]): number | undefined {
  const s = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!s.length) return undefined;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function passes(r: ScreenerRow, f: Filters): boolean {
  if (f.sector && f.sector !== "all" && r.sector !== f.sector) return false;
  if (f.mcapMinCr != null && (r.marketCap == null || r.marketCap / 1e7 < f.mcapMinCr)) return false;
  if (f.peMax != null && (r.pe == null || r.pe <= 0 || r.pe > f.peMax)) return false;
  if (f.pbMax != null && (r.pb == null || r.pb > f.pbMax)) return false;
  if (f.roeMin != null && (r.roe == null || r.roe < f.roeMin)) return false;
  if (f.revGrowthMin != null && (r.revGrowth == null || r.revGrowth < f.revGrowthMin)) return false;
  if (f.epsGrowthMin != null && (r.epsGrowth == null || r.epsGrowth < f.epsGrowthMin)) return false;
  if (f.deMax != null && (r.debtToEquity == null || r.debtToEquity > f.deMax)) return false;
  if (f.momentumOnly && !(r.vs200dma != null && r.vs200dma >= 0 && (r.from52wHigh ?? -100) > -12)) return false;
  return true;
}

const COLUMNS: Array<{ key: SortKey; label: string; title: string; kind: "metric" | "score" }> = [
  { key: "marketCap", label: "Mcap", title: "Market capitalisation", kind: "metric" },
  { key: "price", label: "Price", title: "Last price", kind: "metric" },
  { key: "changePct", label: "Chg%", title: "Day change %", kind: "metric" },
  { key: "pe", label: "P/E", title: "Trailing price / earnings", kind: "metric" },
  { key: "pb", label: "P/B", title: "Price / book", kind: "metric" },
  { key: "peg", label: "PEG", title: "P/E ÷ earnings growth", kind: "metric" },
  { key: "divYield", label: "Div%", title: "Dividend yield", kind: "metric" },
  { key: "roe", label: "ROE%", title: "Return on equity", kind: "metric" },
  { key: "netMargin", label: "NetM%", title: "Net profit margin", kind: "metric" },
  { key: "revGrowth", label: "RevGr%", title: "Revenue growth YoY", kind: "metric" },
  { key: "epsGrowth", label: "EPSGr%", title: "Earnings growth YoY", kind: "metric" },
  { key: "debtToEquity", label: "D/E", title: "Debt / equity (x)", kind: "metric" },
  { key: "vs200dma", label: "200D%", title: "% vs 200-day average", kind: "metric" },
  { key: "from52wHigh", label: "offHi%", title: "% off the 52-week high", kind: "metric" },
  { key: "valueScore", label: "Val", title: "Value sub-score", kind: "score" },
  { key: "qualityScore", label: "Qual", title: "Quality sub-score", kind: "score" },
  { key: "growthScore", label: "Grw", title: "Growth sub-score", kind: "score" },
  { key: "momentumScore", label: "Mom", title: "Momentum sub-score", kind: "score" },
  { key: "composite", label: "SCORE", title: "Overall composite score", kind: "score" },
];

function cellValue(r: ScreenerRow, key: SortKey): string {
  switch (key) {
    case "marketCap":
      return r.marketCap != null ? fmtInrCompact(r.marketCap).replace("₹", "") : "—";
    case "price":
      return r.price != null ? fmt(r.price) : "—";
    case "changePct":
      return r.changePct != null ? fmtPct(r.changePct) : "—";
    case "pe":
      return num(r.pe);
    case "pb":
      return num(r.pb);
    case "peg":
      return num(r.peg, 2);
    case "divYield":
      return num(r.divYield);
    case "roe":
      return num(r.roe);
    case "netMargin":
      return num(r.netMargin);
    case "revGrowth":
      return num(r.revGrowth);
    case "epsGrowth":
      return num(r.epsGrowth);
    case "debtToEquity":
      return num(r.debtToEquity, 2);
    case "vs200dma":
      return num(r.vs200dma);
    case "from52wHigh":
      return num(r.from52wHigh);
    default:
      return (r[key] as number | undefined)?.toString() ?? "—";
  }
}

function NumInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
      <span className="uppercase tracking-wide">{label}</span>
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        className="num h-6 w-16 rounded-sm border border-border bg-background px-1.5 text-[11px] text-foreground focus:border-ring focus:outline-none"
      />
    </label>
  );
}

export default function ScreenerPage() {
  const { data, isLoading, isError, dataUpdatedAt } = useScreener();
  const [filters, setFilters] = useState<Filters>({});
  const [presetIdx, setPresetIdx] = useState(0);
  const [sort, setSort] = useState<SortKey>("composite");
  const [asc, setAsc] = useState(false);

  const applyPreset = (i: number) => {
    setPresetIdx(i);
    setFilters(PRESETS[i].filters);
    setSort(PRESETS[i].sort);
    setAsc(false);
  };

  const toggleSort = (key: SortKey) => {
    if (sort === key) setAsc((a) => !a);
    else {
      setSort(key);
      setAsc(false);
    }
  };

  const rows = useMemo(() => {
    if (!data) return [];
    const filtered = data.rows.filter((r) => passes(r, filters));
    return [...filtered].sort((a, b) => {
      const av = a[sort] as number | undefined;
      const bv = b[sort] as number | undefined;
      if (av == null && bv == null) return 0;
      if (av == null) return 1; // missing sinks to the bottom
      if (bv == null) return -1;
      return asc ? av - bv : bv - av;
    });
  }, [data, filters, sort, asc]);

  const summary = useMemo(() => {
    if (!data) return null;
    const withPe = data.rows.map((r) => r.pe).filter((x): x is number => x != null && x > 0);
    const withRoe = data.rows.map((r) => r.roe).filter((x): x is number => x != null);
    return {
      medPe: median(withPe),
      medRoe: median(withRoe),
    };
  }, [data]);

  return (
    <div className="space-y-2 p-2">
      <PageHeader
        icon={Telescope}
        code="SCRN"
        title="Screener"
        subtitle="Filter & rank the NSE universe on valuation, quality, growth & momentum"
        right={
          data ? (
            <span className="num text-[10px] text-muted-foreground">
              {data.covered}/{data.universe} covered
              {dataUpdatedAt
                ? ` · ${new Date(dataUpdatedAt).toLocaleTimeString("en-IN", { hour12: false })}`
                : ""}
            </span>
          ) : null
        }
      />

      {data && summary && (
        <StatBand cols={4}>
          <StatTile label="Universe" numeric={data.universe} format={(n) => String(Math.round(n))} sub={`${data.covered} with fundamentals`} tone="primary" />
          <StatTile label="Matches" numeric={rows.length} format={(n) => String(Math.round(n))} sub="passing current filter" tone="bull" />
          <StatTile label="Median P/E" value={summary.medPe ? `${summary.medPe.toFixed(1)}x` : "n/a"} sub="universe trailing" tone="neutral" />
          <StatTile label="Median ROE" value={summary.medRoe ? `${summary.medRoe.toFixed(1)}%` : "n/a"} sub="universe" tone="neutral" />
        </StatBand>
      )}

      {/* Preset screens */}
      <Panel code="SCRN" title={<span className="flex items-center gap-1.5"><Filter className="h-3 w-3" /> Preset screens</span>}>
        <div className="flex flex-wrap gap-1.5 p-2.5">
          {PRESETS.map((p, i) => (
            <button
              key={p.label}
              onClick={() => applyPreset(i)}
              title={p.desc}
              className={cn(
                "cursor-pointer rounded-sm border px-2 py-1 text-[11px] transition-colors",
                presetIdx === i
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Panel>

      {/* Custom filters */}
      <Panel
        code="FILT"
        title={<span className="flex items-center gap-1.5"><SlidersHorizontal className="h-3 w-3" /> Custom filters</span>}
        right={
          <button
            onClick={() => { setFilters({}); setPresetIdx(0); }}
            className="cursor-pointer text-[10px] text-muted-foreground hover:text-foreground"
          >
            Reset
          </button>
        }
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-2.5">
          <NumInput label="Mcap≥ (Cr)" value={filters.mcapMinCr} onChange={(v) => setFilters((f) => ({ ...f, mcapMinCr: v }))} />
          <NumInput label="P/E≤" value={filters.peMax} onChange={(v) => setFilters((f) => ({ ...f, peMax: v }))} />
          <NumInput label="P/B≤" value={filters.pbMax} onChange={(v) => setFilters((f) => ({ ...f, pbMax: v }))} />
          <NumInput label="ROE%≥" value={filters.roeMin} onChange={(v) => setFilters((f) => ({ ...f, roeMin: v }))} />
          <NumInput label="RevGr%≥" value={filters.revGrowthMin} onChange={(v) => setFilters((f) => ({ ...f, revGrowthMin: v }))} />
          <NumInput label="EPSGr%≥" value={filters.epsGrowthMin} onChange={(v) => setFilters((f) => ({ ...f, epsGrowthMin: v }))} />
          <NumInput label="D/E≤" value={filters.deMax} onChange={(v) => setFilters((f) => ({ ...f, deMax: v }))} />
          <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="uppercase tracking-wide">Sector</span>
            <select
              value={filters.sector ?? "all"}
              onChange={(e) => setFilters((f) => ({ ...f, sector: e.target.value }))}
              className="h-6 rounded-sm border border-border bg-background px-1 text-[11px] text-foreground focus:border-ring focus:outline-none"
            >
              <option value="all">All</option>
              {data?.sectors.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <input
              type="checkbox"
              checked={!!filters.momentumOnly}
              onChange={(e) => setFilters((f) => ({ ...f, momentumOnly: e.target.checked }))}
              className="h-3 w-3 accent-[var(--primary)]"
            />
            <span className="uppercase tracking-wide">Above 200-DMA</span>
          </label>
        </div>
      </Panel>

      <Panel code="RANK" title={`Results · ${rows.length} names`}>
        {isLoading ? (
          <div className="space-y-2 p-2.5">
            <div className="text-[11px] text-muted-foreground">
              Scoring the universe… the first load builds the fundamentals cache (this can take a few seconds).
            </div>
            <Skeleton className="h-72" />
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            Could not assemble the screener. The upstream data source may be rate-limiting; try again shortly.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-[10px] uppercase tracking-wider">
                  <TableHead className="sticky left-0 z-10 h-7 bg-card">Symbol</TableHead>
                  <TableHead className="h-7">Sector</TableHead>
                  {COLUMNS.map((c) => (
                    <TableHead
                      key={c.key}
                      title={c.title}
                      onClick={() => toggleSort(c.key)}
                      className={cn(
                        "h-7 cursor-pointer select-none text-right whitespace-nowrap hover:text-foreground",
                        sort === c.key && "text-primary"
                      )}
                    >
                      {c.label}
                      {sort === c.key ? (asc ? " ▲" : " ▼") : ""}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.symbol} className="text-[11px]">
                    <TableCell className="num sticky left-0 z-10 bg-card py-1 font-medium">
                      <Link href={`/stock/${encodeURIComponent(r.symbol)}`} className="text-primary hover:underline">
                        {r.symbol}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-32 truncate py-1 text-[10px] text-muted-foreground" title={r.name}>
                      {r.sector ?? "—"}
                    </TableCell>
                    {COLUMNS.map((c) => {
                      const raw = r[c.key] as number | undefined;
                      const cls =
                        c.kind === "score"
                          ? scoreClass(raw)
                          : c.key === "changePct"
                            ? changeClass(raw)
                            : "text-foreground/90";
                      return (
                        <TableCell key={c.key} className={cn("num py-1 text-right", cls, c.key === "composite" && "font-semibold")}>
                          {cellValue(r, c.key)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={COLUMNS.length + 2} className="py-6 text-center text-xs text-muted-foreground">
                      No names match these filters. Loosen a threshold or reset.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
        <p className="border-t border-border/60 p-2 text-[9px] leading-snug text-muted-foreground">
          Factor sub-scores (Val / Qual / Grw / Mom) use the same transparent banding as the Intelligence
          Framework; the composite is their equal-weight blend over available metrics. Fundamentals via Yahoo
          (cached ~6h); names lacking a metric sink to the bottom on that sort. Not investment advice.
        </p>
      </Panel>
    </div>
  );
}
