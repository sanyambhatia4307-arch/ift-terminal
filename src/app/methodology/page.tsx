import { Sigma } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/shell/PageHeader";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Methodology · IFT",
  description: "Every calculation behind the terminal: formulas, thresholds and scoring rules.",
};

/* ---------- building blocks ---------- */

const TOC: Array<{ group: string; items: Array<[string, string]> }> = [
  { group: "Foundations", items: [["pipeline", "Data pipeline"], ["indicators", "Technical indicators"]] },
  {
    group: "Scoring",
    items: [["score", "Intelligence Score"], ["screener", "Screener factors"], ["peers", "Peers and sector medians"]],
  },
  {
    group: "Fundamentals",
    items: [["financials", "Financial statements"], ["estimates", "Analyst estimates"], ["ownership", "Shareholding"]],
  },
  { group: "Charts and AI", items: [["patterns", "Chart patterns"], ["scenario", "AI scenario"], ["sentiment", "News sentiment"]] },
  { group: "Trading", items: [["intraday", "Intraday levels and plan"], ["options", "Options and OI"]] },
  {
    group: "Markets and you",
    items: [
      ["rotation", "Sector rotation"],
      ["market", "Breadth, heatmap, pulse"],
      ["portfolio", "Portfolio risk"],
      ["scans", "Scans and event studies"],
      ["watchlist", "Watchlist signals"],
    ],
  },
];

function Section({
  id,
  code,
  title,
  where,
  lede,
  children,
}: {
  id: string;
  code: string;
  title: string;
  where?: string;
  lede?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-4">
      <Panel
        code={code}
        title={title}
        right={where ? <span className="hidden text-[11px] text-muted-foreground sm:inline">{where}</span> : null}
      >
        <div className="space-y-4 p-4">
          {lede && <p className="max-w-3xl text-[13px] leading-relaxed text-foreground/85">{lede}</p>}
          {children}
        </div>
      </Panel>
    </div>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[12.5px] font-medium text-foreground">{children}</h3>;
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="max-w-3xl text-[12px] leading-relaxed text-muted-foreground">{children}</p>;
}

function Formula({ children }: { children: string }) {
  return (
    <pre className="num overflow-x-auto rounded-md border border-border/70 bg-background/60 px-3.5 py-3 text-[11.5px] leading-[1.75] text-foreground/90">
      {children.trim()}
    </pre>
  );
}

function Defs({ rows }: { rows: Array<[string, string]> }) {
  return (
    <dl className="divide-y divide-border/50 rounded-md border border-border/70">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-1 gap-1 px-3.5 py-2.5 sm:grid-cols-[190px_1fr] sm:gap-5">
          <dt className="text-[12px] font-medium text-foreground/90">{k}</dt>
          <dd className="text-[12px] leading-relaxed text-muted-foreground">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

type Step = [string, number];

function scoreTone(score: number, invert?: boolean) {
  const s = invert ? 100 - score : score;
  return s >= 66 ? "text-bull" : s >= 45 ? "text-primary" : "text-bear";
}

function Chip({ cond, score, invert }: { cond: string; score: number; invert?: boolean }) {
  return (
    <span className="num inline-flex items-baseline gap-1.5 rounded border border-border/70 bg-background/40 px-2 py-0.5 text-[11px]">
      <span className="text-muted-foreground">{cond}</span>
      <span className={cn("font-semibold", scoreTone(score, invert))}>{score}</span>
    </span>
  );
}

/** One scoring input: conditions read left to right, the first match sets the score. */
function Ladder({
  label,
  steps,
  otherwise,
  invert,
}: {
  label: string;
  steps: Step[];
  otherwise?: number;
  invert?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-border/40 py-2 last:border-0 md:flex-row md:items-baseline md:gap-4">
      <div className="text-[12px] text-muted-foreground md:w-52 md:shrink-0">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {steps.map(([cond, score]) => (
          <Chip key={cond} cond={cond} score={score} invert={invert} />
        ))}
        {otherwise !== undefined && <Chip cond="otherwise" score={otherwise} invert={invert} />}
      </div>
    </div>
  );
}

function Pillar({
  name,
  weight,
  note,
  children,
}: {
  name: string;
  weight: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border/70 bg-background/30 px-3.5 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[13px] font-medium text-foreground">{name}</h3>
        <span className="num text-[11px] text-primary">weight {weight}</span>
      </div>
      {note && <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{note}</p>}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

/* ---------- page ---------- */

export default function MethodologyPage() {
  return (
    <div className="space-y-3 p-2.5">
      <PageHeader
        icon={Sigma}
        code="CALC"
        title="Methodology"
        subtitle="Every number on the terminal and exactly how it is calculated. Nothing here is a black box: if a score moves, the rule that moved it is on this page."
      />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-border bg-card px-4 py-2.5 text-[11.5px] text-muted-foreground">
        <span className="text-foreground/85">How to read the scoring ladders</span>
        <span>Conditions read left to right; the first one that matches sets the score.</span>
        <span className="num">
          <span className="text-bull">66+</span> strong · <span className="text-primary">45 to 65</span> neutral ·{" "}
          <span className="text-bear">below 45</span> weak
        </span>
      </div>

      {/* Mobile table of contents */}
      <nav className="flex gap-1.5 overflow-x-auto pb-1 lg:hidden">
        {TOC.flatMap((g) => g.items).map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="shrink-0 rounded-md border border-border bg-card px-2.5 py-1 text-[11.5px] text-muted-foreground hover:text-foreground"
          >
            {label}
          </a>
        ))}
      </nav>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[200px_minmax(0,1fr)]">
        {/* Desktop table of contents */}
        <aside className="hidden lg:block">
          <nav className="sticky top-3 space-y-4 rounded-lg border border-border bg-card p-3">
            {TOC.map((g) => (
              <div key={g.group}>
                <div className="pb-1 text-[10.5px] font-medium text-muted-foreground/60">{g.group}</div>
                {g.items.map(([id, label]) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="block rounded px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                  >
                    {label}
                  </a>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 space-y-3">
          {/* ---------- Data pipeline ---------- */}
          <Section
            id="pipeline"
            code="DATA"
            title="Data pipeline"
            where="Every page"
            lede="Your browser never calls a market data source directly. Every number is fetched on the server, normalised, cached, and only then sent to the page. When a source fails, the server falls back to the next one instead of leaving a panel blank."
          >
            <Formula>{`
browser  →  /api/<route>  →  market gateway  →  cache  →  NSE · Yahoo Finance · RSS · OpenRouter (AI)

Cache        a stored value is reused until its window expires; an expired value is still
             served instantly while a fresh copy loads in the background
Fallbacks    indices and movers: NSE first, Yahoo if NSE refuses
             AI: two paid models, then one free model, then the rule-based version
`}</Formula>
            <Sub>How long each value is reused</Sub>
            <Defs
              rows={[
                ["Single quote", "20 seconds"],
                ["Quote batches, indices", "30 seconds"],
                ["Option chain", "60 seconds"],
                ["Market pulse", "2 minutes"],
                ["News", "5 minutes"],
                ["AI analysis per stock", "10 minutes"],
                ["Sector rotation", "15 minutes"],
                ["Screener universe, top picks", "30 minutes"],
                ["Fundamentals, estimates, beta", "6 hours"],
                ["Shareholding", "12 hours"],
                ["Multi-year financials", "24 hours"],
              ]}
            />
          </Section>

          {/* ---------- Technical indicators ---------- */}
          <Section
            id="indicators"
            code="TECH"
            title="Technical indicators"
            where="Stock page · scores · scans"
            lede="Computed from about one year of daily candles. These feed the Momentum and Risk pillars, the top-picks scan, the pattern detector and the AI prompt."
          >
            <Formula>{`
SMA(n)              average of the last n closes                      n = 20, 50, 200
EMA(n)              close × k + previous EMA × (1 - k),  k = 2 ÷ (n + 1)
RSI(14)             100 - 100 ÷ (1 + average gain ÷ average loss)
                    first average over 14 days, then Wilder smoothing:
                    average = (previous average × 13 + today) ÷ 14;  no losses at all = 100
MACD histogram      (EMA12 - EMA26) minus the 9-period EMA of that line
Return over d days  (close today ÷ close d sessions ago - 1) × 100    1M = 21, 3M = 63, 6M = 126
Volatility          standard deviation of daily returns × √252 × 100  (annualised, %)
Volume ratio        average volume of the last 5 days ÷ last 20 days
Support             lowest close of the last 60 sessions
Resistance          highest close of the last 60 sessions
From 52-week high   (close ÷ highest close of the year - 1) × 100
`}</Formula>
            <Note>
              The 52-week high and low here use closing prices from the one-year series, so they can differ slightly
              from an intraday high quoted elsewhere.
            </Note>
          </Section>

          {/* ---------- Intelligence Score ---------- */}
          <Section
            id="score"
            code="INTL"
            title="Intelligence Score"
            where="Stock page"
            lede="Seven pillars, each scored 0 to 100. A pillar's score is the plain average of whichever of its inputs exist. A pillar with no usable input shows n/a and is left out of the total instead of being guessed."
          >
            <Formula>{`
Overall      Σ (pillar score × weight) ÷ Σ weights of the pillars that have data
             Risk enters as (100 - Risk), so more risk lowers the total

Weights      Valuation 15% · Growth 15% · Quality 15% · Momentum 20%
             Financial strength 10% · Sentiment 10% · Risk 15%

Stance       68 or more Constructive · 45 to 67 Balanced · below 45 Cautious
Confidence   6 or 7 pillars with data = high · 4 or 5 = medium · fewer = low

Drivers      pillars scoring 58+, ranked by weight × distance from 50; top 4 shown
Risks        the Risk pillar's flags, then weak pillars (below 45); top 4 shown
`}</Formula>

            <div className="space-y-2.5">
              <Pillar
                name="Valuation"
                weight="15%"
                note="P/E and P/B are judged against the median of the stock's own sector (from the screener universe). Absolute bands are used only when no sector data exists."
              >
                <Ladder
                  label="P/E ÷ sector median P/E"
                  steps={[["< 0.7×", 86], ["< 0.9×", 70], ["< 1.1×", 55], ["< 1.4×", 40]]}
                  otherwise={26}
                />
                <Ladder label="P/E, no sector data" steps={[["< 15", 82], ["< 22", 68], ["< 32", 52], ["< 45", 38]]} otherwise={24} />
                <Ladder
                  label="PEG = P/E ÷ EPS growth %"
                  steps={[["< 1", 86], ["< 1.5", 68], ["< 2.5", 50]]}
                  otherwise={32}
                />
                <Ladder
                  label="P/B ÷ sector median P/B"
                  steps={[["< 0.7×", 80], ["< 0.95×", 64], ["< 1.3×", 50]]}
                  otherwise={34}
                />
                <Ladder label="P/B, no sector data" steps={[["< 2", 78], ["< 4", 60], ["< 8", 45]]} otherwise={30} />
                <Formula>{`Street target    score = 50 + (target ÷ price - 1) × 100 × 1.8, kept within 0..100`}</Formula>
              </Pillar>

              <Pillar
                name="Growth"
                weight="15%"
                note="Multi-year CAGR is used when 3 or more years of statements exist; otherwise the latest year-on-year figure."
              >
                <Ladder label="Revenue CAGR" steps={[["> 18%", 88], ["> 12%", 74], ["> 7%", 58], ["> 2%", 44]]} otherwise={26} />
                <Ladder label="Revenue YoY (fallback)" steps={[["> 18%", 88], ["> 10%", 72], ["> 4%", 56], ["> 0%", 44]]} otherwise={22} />
                <Ladder label="Earnings CAGR" steps={[["> 20%", 88], ["> 12%", 74], ["> 5%", 58], ["> 0%", 44]]} otherwise={24} />
                <Ladder label="Earnings YoY (fallback)" steps={[["> 20%", 88], ["> 10%", 72], ["> 0%", 54]]} otherwise={24} />
                <Ladder
                  label="Years revenue grew ÷ years measured"
                  steps={[["every year", 82], ["≥ 66%", 62], ["≥ 50%", 46]]}
                  otherwise={30}
                />
              </Pillar>

              <Pillar
                name="Quality"
                weight="15%"
                note="Leads with capital efficiency and cash, the measures that are hardest to dress up."
              >
                <Ladder label="ROCE" steps={[["> 20%", 90], ["> 15%", 76], ["> 12%", 58], ["> 8%", 42]]} otherwise={22} />
                <Ladder label="Cash conversion (FCF ÷ PAT)" steps={[["> 80%", 84], ["> 50%", 66], ["> 0%", 48]]} otherwise={28} />
                <Ladder label="ROE" steps={[["> 20%", 90], ["> 14%", 74], ["> 8%", 55], ["> 0%", 38]]} otherwise={18} />
                <Ladder label="Net margin" steps={[["> 18%", 86], ["> 10%", 70], ["> 4%", 52], ["> 0%", 38]]} otherwise={15} />
                <Ladder label="Operating margin" steps={[["> 20%", 84], ["> 12%", 66], ["> 5%", 50]]} otherwise={32} />
              </Pillar>

              <Pillar name="Momentum" weight="20%" note="The heaviest pillar: the market's own vote on the stock.">
                <Formula>{`
Trend structure   (price > 50-DMA ? 30 : 8) + (price > 200-DMA ? 25 : 8)
                  + (50-DMA > 200-DMA ? 30 : 8) + 7                    range 31 to 92
3-month return    50 + 3M return % × 2.2, kept within 0..100
`}</Formula>
                <Ladder
                  label="RSI(14)"
                  steps={[["45 to 65", 75], ["65 to 72", 60], ["above 72", 40], ["35 to 45", 55]]}
                  otherwise={35}
                />
                <Note>Trading within 6% of the 52-week high adds a driver note but no points.</Note>
              </Pillar>

              <Pillar name="Financial strength" weight="10%">
                <Ladder label="Debt ÷ equity" steps={[["< 0.4×", 88], ["< 0.9×", 68], ["< 1.8×", 46]]} otherwise={24} />
                <Ladder label="Cash ÷ total debt" steps={[["> 1×", 85], ["> 0.5×", 65], ["> 0.2×", 48]]} otherwise={32} />
              </Pillar>

              <Pillar
                name="Sentiment"
                weight="10%"
                note="Leads with analyst estimate revisions, a hard signal, before any reading of news tone."
              >
                <Formula>{`
Estimate revisions   50 + (up - down) ÷ (up + down) × 42        up / down = analysts revising EPS in 30 days
AI news read         50 + ensemble sentiment (-1..1) × 38
Keyword fallback     50 + keyword score (-1..1) × 38             used only when AI is unavailable
`}</Formula>
                <Ladder
                  label="Analyst consensus"
                  steps={[["strong buy", 90], ["buy", 74], ["hold", 50], ["underperform", 30], ["sell", 15]]}
                />
              </Pillar>

              <Pillar
                name="Risk"
                weight="15% (inverted)"
                note="Shown as-is, so a high number means more risk. Colours are flipped here: red means risky."
              >
                <Ladder
                  label="Annualised volatility"
                  steps={[["< 18%", 25], ["< 28%", 42], ["< 42%", 62]]}
                  otherwise={82}
                  invert
                />
                <Ladder label="Beta" steps={[["> 1.4", 72], ["> 1.1", 55]]} otherwise={35} invert />
                <Ladder label="Drawdown" steps={[["> 25% below 52w high", 70]]} invert />
                <Ladder label="Leverage" steps={[["debt ÷ equity > 1.8×", 75]]} invert />
                <Note>Institutional holding above 45% is flagged as crowded-exit risk in words, without changing the score.</Note>
              </Pillar>
            </div>
          </Section>

          {/* ---------- Screener ---------- */}
          <Section
            id="screener"
            code="SCRN"
            title="Screener factor scores"
            where="Screener"
            lede="The screener scores about 130 names (the union of the curated NSE index lists) on four factors. Each factor is the average of its available metrics; the composite is the equal-weight average of the factors that exist. Unlike the stock page, these bands are absolute, because the screener ranks the whole market against itself."
          >
            <div className="space-y-2.5">
              <Pillar name="Value" weight="¼ of composite">
                <Ladder label="P/E" steps={[["≤ 15", 85], ["≤ 22", 68], ["≤ 32", 52], ["≤ 45", 38]]} otherwise={24} />
                <Ladder label="P/B" steps={[["≤ 2", 80], ["≤ 4", 62], ["≤ 8", 45]]} otherwise={30} />
                <Ladder label="PEG" steps={[["≤ 1", 85], ["≤ 1.5", 68], ["≤ 2.5", 50]]} otherwise={32} />
                <Ladder label="Dividend yield" steps={[["≥ 3%", 75], ["≥ 1.5%", 60], ["≥ 0.5%", 52]]} otherwise={45} />
              </Pillar>
              <Pillar name="Quality" weight="¼ of composite">
                <Ladder label="ROE" steps={[["≥ 20%", 90], ["≥ 14%", 74], ["≥ 8%", 55], ["≥ 0%", 38]]} otherwise={18} />
                <Ladder label="Net margin" steps={[["≥ 18%", 86], ["≥ 10%", 70], ["≥ 4%", 52], ["≥ 0%", 38]]} otherwise={15} />
                <Ladder label="Operating margin" steps={[["≥ 20%", 84], ["≥ 12%", 66], ["≥ 5%", 50]]} otherwise={32} />
                <Ladder label="Debt ÷ equity" steps={[["≤ 0.4×", 88], ["≤ 0.9×", 68], ["≤ 1.8×", 46]]} otherwise={24} />
              </Pillar>
              <Pillar name="Growth" weight="¼ of composite">
                <Ladder label="Revenue growth YoY" steps={[["≥ 18%", 88], ["≥ 10%", 72], ["≥ 4%", 56], ["≥ 0%", 44]]} otherwise={22} />
                <Ladder label="EPS growth YoY" steps={[["≥ 20%", 88], ["≥ 10%", 72], ["≥ 0%", 54]]} otherwise={24} />
              </Pillar>
              <Pillar name="Momentum" weight="¼ of composite">
                <Formula>{`
vs 200-DMA          50 + (% above 200-DMA) × 1.6, kept within 8..92
vs 52-week high     90 + (% from 52-week high) × 1.2, kept within 10..90
`}</Formula>
              </Pillar>
            </div>
            <Formula>{`
PEG          P/E ÷ EPS growth %          only when both are positive
Composite    average of the available Value, Quality, Growth and Momentum scores
`}</Formula>
            <Sub>Preset screens</Sub>
            <Defs
              rows={[
                ["Quality compounders", "ROE ≥ 15%, debt ÷ equity ≤ 0.6×, EPS growth ≥ 8%, sorted by Quality"],
                ["Value", "P/E ≤ 20 and P/B ≤ 3, sorted by Value"],
                ["Growth leaders", "Revenue and EPS growth both ≥ 12%, sorted by Growth"],
                ["Momentum", "Above the 200-DMA and within 12% of the 52-week high, sorted by Momentum"],
                ["Low debt, high ROE", "Debt ÷ equity ≤ 0.5× and ROE ≥ 15%, sorted by Quality"],
              ]}
            />
            <Note>A name missing a metric you filter on is excluded rather than assumed to pass. Missing values sort to the bottom.</Note>
          </Section>

          {/* ---------- Peers ---------- */}
          <Section
            id="peers"
            code="PEER"
            title="Peers and sector medians"
            where="Stock page · Valuation pillar"
            lede="Peers are the other screener names in the same Yahoo sector. The same medians drive the sector-relative Valuation pillar."
          >
            <Formula>{`
Peer set          same-sector names in the universe, largest 14 by market cap
Sector median     middle value of each metric across those names (positive P/E only)
P/E vs sector     (stock P/E ÷ sector median P/E - 1) × 100
Rank              1 + number of peers strictly better      (lower P/E is better; higher ROE is better)
`}</Formula>
          </Section>

          {/* ---------- Financials ---------- */}
          <Section
            id="financials"
            code="FIN"
            title="Financial statements"
            where="Stock page · Quality and Growth pillars"
            lede="Annual consolidated statements for the last four to five fiscal years. The fiscal-year label is the year the period ends, so March 2026 is FY26."
          >
            <Formula>{`
Capital employed    total assets - current liabilities
ROCE                EBIT ÷ capital employed × 100
EBIT margin         EBIT ÷ revenue × 100
Net margin          net income ÷ revenue × 100
Free cash flow      reported FCF, or operating cash flow + capex (capex is negative)
Cash conversion     free cash flow ÷ net income × 100
CAGR                (last value ÷ first value)^(1 ÷ years) - 1        positive values only
`}</Formula>
          </Section>

          {/* ---------- Estimates ---------- */}
          <Section
            id="estimates"
            code="EST"
            title="Analyst estimates"
            where="Stock page · Sentiment pillar"
            lede="Consensus EPS for this fiscal year and next, the expected growth, the analyst count, and how many analysts raised or cut their estimate over the last 30 days."
          >
            <Formula>{`
Net revision     up - down                         (this year's EPS, last 30 days)
Trend            rising if net > 0, falling if net < 0, flat if equal or no revisions
Pillar input     50 + (up - down) ÷ (up + down) × 42
`}</Formula>
          </Section>

          {/* ---------- Shareholding ---------- */}
          <Section
            id="ownership"
            code="SHLD"
            title="Shareholding"
            where="Stock page"
            lede="Quarterly promoter and public holding from NSE filings, usually the last five quarters."
          >
            <Formula>{`
Promoter change    latest promoter % - earliest promoter % in the window   (percentage points)
Trend              rising above +0.3 pts · falling below -0.3 pts · stable otherwise
`}</Formula>
            <Note>Promoter pledge and the FII/DII split are not in this free feed, so they are not shown or scored.</Note>
          </Section>

          {/* ---------- Patterns ---------- */}
          <Section
            id="patterns"
            code="PATT"
            title="Chart pattern detection"
            where="Stock page chart"
            lede="A geometric detector, not an opinion: it fits straight lines through swing highs and swing lows and classifies their slopes."
          >
            <Formula>{`
1  Window        last 120 daily candles (needs at least 60)
2  Pivots        swing high = highest high with 5 lower bars on each side
                 swing low  = lowest low with 5 higher bars on each side
3  Rails         least-squares line through the swing highs (resistance)
                 and through the swing lows (support)
4  Slope         slope ÷ last price × 100 = % per bar;   within ±0.04% per bar = flat
5  Converging    gap between rails today < 70% of the gap at the start
6  Height        gap between rails at the start of the window (sizes the target)
7  Confidence    7+ pivots high · 5 or 6 medium · fewer low
8  Display       rails are extended forward by 18% of the window to show the breakout zone
`}</Formula>
            <Sub>Classification, checked in this order</Sub>
            <Defs
              rows={[
                [
                  "Double top",
                  "Last two swing highs within 2% of each other, more than 8 bars apart, price below the first top. Trigger: a close below the neckline (lowest of the last 3 swing lows). Target: neckline - (top - neckline).",
                ],
                [
                  "Double bottom",
                  "Mirror image. Trigger: a close above the neckline (highest of the last 3 swing highs). Target: neckline + (neckline - bottom).",
                ],
                [
                  "Symmetrical triangle",
                  "Converging, resistance falling, support rising. Trigger: the rail in the direction of the combined slope. Target: price ± height.",
                ],
                ["Ascending triangle", "Flat resistance, rising support. Trigger: a close above resistance. Target: resistance + height."],
                ["Descending triangle", "Falling resistance, flat support. Trigger: a close below support. Target: support - height."],
                ["Rising wedge", "Converging, both rails rising. Trigger: a close below the lower rail. Target: price - height."],
                ["Falling wedge", "Converging, both rails falling. Trigger: a close above the upper rail. Target: price + height."],
                ["Ascending channel", "Both rails rising, not converging. The lower rail is the line that must hold."],
                ["Descending channel", "Both rails falling. The upper rail caps rallies until price closes above it."],
                ["Range", "Anything else. The nearer edge is flagged as the trigger."],
              ]}
            />
            <Formula>{`Target %    (target ÷ price - 1) × 100`}</Formula>
          </Section>

          {/* ---------- AI scenario ---------- */}
          <Section
            id="scenario"
            code="AI"
            title="AI scenario and projection"
            where="Stock page chart · Sentiment pillar"
            lede="A scenario range, not a forecast. Two paid models read the same inputs (one year of technicals, a fundamentals snapshot, the detected pattern and up to 18 recent headlines) and answer independently."
          >
            <Formula>{`
Each model returns   sentiment and technical bias (-1..1), base / bull / bear return %
                     over 45 sessions, and a confidence (0..1)

Ensemble             sentiment, bias, base return, confidence = average of the models
                     bull = the highest bull of the models,  bear = the lowest bear

Chart horizon        1M chart = 12 sessions · 6M = 22 · 1Y = 45
                     scaled return = model return × horizon ÷ 45

Fallback (no AI)     daily drift = 0.5 × R3M ÷ 63 + 0.3 × R1M ÷ 21 + 0.2 × R6M ÷ 126
                     base = drift × horizon, kept within ±25%
                     band = annual volatility × √(horizon ÷ 252)
                     bull = base + band,  bear = base - band

Guards               bull ≥ base + 0.5%,  bear ≤ base - 0.5%
Targets              last price × (1 + scenario %)
Path                 a straight glide from today to each target across trading days
`}</Formula>
            <Note>
              Both paid models share one budget of 1,000,000 tokens per day, reset at midnight IST. Once it is spent a single
              free model answers instead, and if that fails too the momentum fallback above is used. Each model&apos;s own
              note is shown on the stock page so you can see where they disagree.
            </Note>
          </Section>

          {/* ---------- Sentiment ---------- */}
          <Section
            id="sentiment"
            code="NLP"
            title="News sentiment (keyword fallback)"
            where="Used only when AI is unavailable"
            lede="A deliberately simple and transparent read of recent headlines, used when the AI read is not available."
          >
            <Formula>{`
Per headline    count bullish words vs bearish words from two fixed lists
                more bullish = positive · more bearish = negative · tie = neutral
Score           (positive - negative) ÷ max(positive + negative, 3)            range -1..1
`}</Formula>
            <Note>
              The floor of 3 in the denominator stops a single headline from pushing the score to the extreme. Example words:
              surge, beat, upgrade, order, buyback on one side; plunge, miss, downgrade, probe, default on the other.
            </Note>
          </Section>

          {/* ---------- Intraday ---------- */}
          <Section
            id="intraday"
            code="INTR"
            title="Intraday levels and trade plan"
            where="Intraday"
            lede="Classic floor-trader pivots and the central pivot range (CPR), computed from a basis session: the previous session while the market is open, or the last session when it is closed (giving tomorrow's levels)."
          >
            <Formula>{`
H, L, C        high, low, close of the basis session (5-minute candles)
Pivot P        (H + L + C) ÷ 3
CPR            BC = (H + L) ÷ 2,   TC = 2P - BC      (shown low to high)
R1 = 2P - L          R2 = P + (H - L)          R3 = H + 2 × (P - L)
S1 = 2P - H          S2 = P - (H - L)          S3 = L - 2 × (H - P)
Opening range  high and low of the first 15 minutes (three 5-minute candles)
EMA20          20-period EMA of today's 5-minute closes
Narrow CPR     (TC - BC) ÷ P below 0.15%   →  trend-day potential
`}</Formula>
            <Sub>Bias</Sub>
            <Defs
              rows={[
                ["Bullish", "Price above the pivot, above the top of the CPR, and above the 5-minute 20-EMA."],
                ["Bearish", "Price below the pivot, below the bottom of the CPR, and below the 5-minute 20-EMA."],
                ["Neutral", "Anything else: price is inside or chopping around the CPR."],
              ]}
            />
            <Sub>Trade plan</Sub>
            <Formula>{`
LONG     entry  = max(price, opening-range high)
         stop   = highest of BC, opening-range low (or S1), S1
         T1     = R1 if entry is below R1, else R2;     T2 = the next level up
SHORT    mirror image on the low side with S levels
WAIT     entry  = TC (breakout trigger),  stop = BC,  targets R1 and R2

Risk     |entry - stop| points          Reward   |T1 - entry| points
R:R      reward ÷ risk
P&L      points × lot size     NIFTY 75 · BANKNIFTY 35 · FINNIFTY 65 · MIDCPNIFTY 140 · SENSEX 20
`}</Formula>
          </Section>

          {/* ---------- Options ---------- */}
          <Section
            id="options"
            code="OPTS"
            title="Options and open interest"
            where="Intraday"
            lede="Built from the NSE option chain for the nearest weekly expiry (NIFTY, BANKNIFTY, FINNIFTY and MIDCPNIFTY; SENSEX options trade on BSE and are not covered)."
          >
            <Formula>{`
PCR           total put open interest ÷ total call open interest
Read          1.3 or more put-heavy (support below) · 0.75 or less call-heavy (resistance above) · else balanced
Resistance    strike with the most call OI        (call writers defend it)
Support       strike with the most put OI         (put writers defend it)
Max pain      for every strike P:
                pain(P) = Σ callOI(K) × max(0, P - K) + Σ putOI(K) × max(0, K - P)
              max pain = the strike with the lowest pain(P)
Table         the 14 strikes closest to spot
`}</Formula>
          </Section>

          {/* ---------- Rotation ---------- */}
          <Section
            id="rotation"
            code="ROTN"
            title="Sector rotation"
            where="Rotation"
            lede="Twelve NSE sector indices measured against the NIFTY 50 on six months of daily closes, then placed on a Relative Rotation Graph."
          >
            <Formula>{`
Returns       1M = last 21 sessions · 3M = 63 · 6M = the whole series
RS            sector return - NIFTY 50 return over the same window
RS level      3M RS                 (x axis)
RS momentum   1M RS - 3M RS         (y axis; positive = improving)
Quadrant      RS ≥ 0 and momentum ≥ 0  Leading      RS ≥ 0 and momentum < 0  Weakening
              RS < 0 and momentum < 0  Lagging      RS < 0 and momentum ≥ 0  Improving
Rank score    0.5 × RS3M + 0.3 × RS1M + 0.2 × RS6M
`}</Formula>
            <Note>
              Sectors: Bank, IT, Auto, Pharma, FMCG, Metal, Realty, Energy, Fin Services, PSU Bank, Media, Infra.
              Leadership usually rotates clockwise: Improving, Leading, Weakening, Lagging.
            </Note>
          </Section>

          {/* ---------- Market ---------- */}
          <Section
            id="market"
            code="MKT"
            title="Breadth, heatmap and market pulse"
            where="Dashboard · Markets"
          >
            <Formula>{`
% advancing      advances ÷ (advances + declines) × 100
Mood             66+ Risk-on · 55+ Constructive · 45+ Mixed · 33+ Cautious · below Risk-off
Heatmap          colour depth = min(1, |% change| ÷ 3); tiles reach full colour at ±3%
Front headline   NIFTY 50 move + best and worst sector index of the day + % advancing
`}</Formula>
            <Sub>Pulse anomalies (flagged when the day&apos;s move reaches the threshold; high severity at 1.8×)</Sub>
            <Defs
              rows={[
                ["Equities", "S&P 500 1.2% · Nasdaq 1.5% · Dow 1.2% · FTSE 1.2% · DAX 1.4% · Nikkei 1.5% · Hang Seng 1.5%"],
                ["US futures", "S&P futures 1.0% · Nasdaq futures 1.2%"],
                ["FX, rates, commodities", "USD/INR 0.4% · US 10Y yield 2.0% · Brent 2.5% · Gold 1.5% · Bitcoin 4.0%"],
                ["India VIX", "Level 20 or more = high · a move of 8% or more = medium"],
                ["FII flows", "Net ₹3,000 Cr or more = medium · ₹6,000 Cr or more = high"],
                ["Tug of war", "FII net selling above ₹1,000 Cr while DII net buying above ₹1,000 Cr"],
              ]}
            />
            <Formula>{`
Day brief    US average move  > +0.3% firm, < -0.3% weak, else flat
             US futures       ±0.2%      Asia average  ±0.3%
             Rupee mentioned only if USD/INR moves more than 0.15%
`}</Formula>
          </Section>

          {/* ---------- Portfolio ---------- */}
          <Section
            id="portfolio"
            code="RISK"
            title="Portfolio risk"
            where="Portfolio"
            lede="Everything is computed in your browser from your holdings and live quotes, except beta, which the server computes from price history."
          >
            <Formula>{`
Value           quantity × last price;   total P&L = value - invested;   day P&L = quantity × day change
Weight          position value ÷ portfolio value
Top-5 weight    sum of the five largest weights
HHI             Σ weight²
Effective N     1 ÷ HHI          (how many equal-sized positions the book behaves like)
Sector mix      position values grouped by sector

Stock beta      cov(stock, NIFTY) ÷ var(NIFTY), daily returns over 1 year on matching dates
                (needs 60+ common days)
Portfolio beta  Σ weight × beta, re-weighted over names that have a beta;
                shown only when those names cover 60% or more of the value

Concentrated    largest position > 25%, or top-5 > 70%, or one sector > 40%
`}</Formula>
            <Note>
              Beta is computed in-house because the vendor beta for Indian listings proved unreliable. Positions are stored
              only in your browser.
            </Note>
          </Section>

          {/* ---------- Scans ---------- */}
          <Section id="scans" code="SCAN" title="Scans and event studies" where="Dashboard · Earnings">
            <Sub>Top picks (technical scan of the NIFTY 50)</Sub>
            <Formula>{`
Trend        ±0.20 price vs 50-DMA · ±0.15 price vs 200-DMA · ±0.15 50-DMA vs 200-DMA
Momentum     + (3M return ÷ 25, kept within -1..1) × 0.25
RSI          +0.15 below 32 (oversold) · -0.15 above 72 (overbought)
MACD         +0.10 if the histogram is positive, else -0.10
Score        sum kept within -1..1; the top 6 are shown
`}</Formula>
            <Sub>Results reactions</Sub>
            <Formula>{`
Dates        the last results board meetings from NSE (up to 8 kept)
Reaction     (first close after the announcement day ÷ last close before it - 1) × 100
Stats        average, median, % positive, best, worst, average absolute move   (needs 3+ prints)
EPS surprise Yahoo's reported surprise % (actual vs consensus estimate)
`}</Formula>
            <Note>
              Measuring from the close before to the first close after captures the reaction whether results land during
              market hours or after the close.
            </Note>
          </Section>

          {/* ---------- Watchlist ---------- */}
          <Section
            id="watchlist"
            code="WL"
            title="Watchlist signals and alerts"
            where="Watchlist"
            lede="Checked against live quotes every time they refresh, entirely in your browser."
          >
            <Formula>{`
Big mover       |day change| ≥ 3%
Near high       price ≥ 97% of the 52-week high
Near low        price ≤ 103% of the 52-week low
Alert above     triggers when price ≥ your level
Alert below     triggers when price ≤ your level
`}</Formula>
          </Section>

          <div className="rounded-lg border border-border bg-card px-4 py-3 text-[12px] leading-relaxed text-muted-foreground">
            None of these calculations produce a buy or sell instruction. Scores are transparent, rule-based and repeatable;
            AI output is labelled as a scenario. Data comes from free public sources and can be delayed up to 15 minutes.
            Not investment advice. For data sources and refresh details see the{" "}
            <Link href="/guide" className="text-primary hover:underline">
              Guide
            </Link>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
