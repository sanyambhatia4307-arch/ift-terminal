import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Panel } from "@/components/ui/panel";

const SOURCES: Array<[string, string, string, string, string]> = [
  // [Section, Source, Refresh, Freshness, Notes]
  ["Index ticker & Major Indices", "NSE public API (allIndices) → Yahoo fallback", "30s poll", "Real-time when NSE serves; ≤15min via Yahoo", "Includes per-index P/E, P/B, dividend yield, advance/decline"],
  ["Market status & IST clock", "NSE marketStatus → trading-hours inference", "60s poll", "Live", "Drives market-hours behaviour across the app"],
  ["Top Gainers / Losers", "NSE constituents → Yahoo quote scan fallback", "60s poll", "≤15min", "NIFTY 50 universe"],
  ["Top Picks scan", "Yahoo daily charts (50 symbols)", "30min cache", "Daily bars", "Technical-only scan; full scoring on stock page"],
  ["Market Pulse (global)", "Yahoo (indices, futures, FX, commodities, rates, crypto)", "2min poll", "Mixed: live to 15min by venue", "Anomaly rules run server-side on every refresh"],
  ["FII/DII flows", "NSE fiidiiTradeReact", "2min poll", "Previous session (published nightly)", "₹ crore, provisional figures"],
  ["Stock quote & chart", "Yahoo v8 chart API", "20-60s poll", "≤15min", "OHLCV 1m→monthly; IST axis"],
  ["Fundamentals", "Yahoo quoteSummary (yahoo-finance2)", "6h cache", "Latest reported financials", "P/E, ROE, margins, debt, holders, street targets"],
  ["Multi-year financials", "Yahoo fundamentalsTimeSeries (annual)", "24h cache", "Last 4-5 fiscal years", "Revenue/EBIT/PAT, margins, ROCE, FCF, cash conversion (legacy statement modules went dark in 2024)"],
  ["Analyst estimates & revisions", "Yahoo earningsTrend", "6h cache", "Live consensus", "Forward EPS this/next year + count of up vs down revisions (30d); feeds Sentiment pillar"],
  ["Screener", "Bulk quotes + cached fundamentals over the curated universe", "30min cache", "≤15min price · 6h fundamentals", "Factor sub-scores computed in-house; also yields sector medians for relative valuation"],
  ["Sector rotation", "Yahoo 6-month charts for 12 sector indices vs NIFTY", "15min cache", "Daily bars", "Relative strength + RS-momentum → RRG quadrant"],
  ["Intelligence Score", "Computed in-house from fundamentals, financials, estimates, technicals + AI", "10min cache", "Recomputed on refresh", "Seven explainable pillars; sector-relative valuation; no black box"],
  ["AI sentiment (NLP)", "OpenRouter free model on ~20 headlines", "10min cache", "Live", "Materiality-weighted; feeds Sentiment pillar + projection. Lexicon fallback"],
  ["AI scenario (dual-model)", "OpenRouter paid ensemble (deepseek-v4-flash + gpt-4o-mini)", "10min cache", "Live", "Averaged; shared 1M-token/day budget; downgrades to free model when spent"],
  ["Chart scenario & patterns", "Computed: dual-model AI + momentum + detected pattern", "10min cache", "Recomputed", "Base/bull/bear scenario range (NOT a forecast) + breakout-aware patterns; orientation only"],
  ["Portfolio beta", "Yahoo 1y daily returns regressed vs NIFTY 50", "6h cache", "Daily bars", "Computed in-house (vendor beta for .NS names is unreliable)"],
  ["News (all surfaces)", "Google News RSS (India) + ET Markets RSS", "5min poll", "Live headlines", "Deduplicated across sources"],
  ["Earnings calendar & briefs", "Yahoo calendarEvents + NSE dates + AI brief", "12h cache", "Live", "Upcoming dates; expansion adds AI results brief"],
  ["Results reactions", "NSE event-calendar dates + Yahoo prices/EPS", "12h cache", "Historical", "Last 8 prints: day-after move + EPS surprise"],
  ["Bulk & block deals", "NSE snapshot-capital-market-largedeal", "5min poll", "Live (session)", "Institutional prints with client, side, value"],
  ["Portfolio P&L", "Local holdings × live Yahoo quotes", "45s poll", "≤15min", "Holdings persist in your browser only"],
  ["Compare", "Live quotes + fundamentals + 1Y charts (Yahoo)", "on demand", "≤15min", "Up to 4 symbols, performance rebased to 100"],
  ["Intraday levels & plan", "Yahoo 5m chart + NSE status", "60s poll", "≤15min", "Pivots/CPR from prior session; OR from live session"],
  ["IPO dossiers", "Editorial research (dated) + live Google News per company", "News: 10min", "Dossier static · news live", "No free machine-readable DRHP feed exists"],
  ["Commodities", "Yahoo futures + NSE ETFs, live USD/INR conversion", "60s poll", "≤15min", "₹/unit per Indian convention; rows open full research view"],
];

const PILLARS: Array<[string, string, string]> = [
  ["Valuation", "P/E and P/B scored RELATIVE to the sector median (not absolute) + PEG; upside to mean analyst target", "A 40x compounder isn't 'expensive' if its sector trades at 40x · the driver shows the premium/discount vs sector"],
  ["Growth", "Multi-year revenue & earnings CAGR and growth consistency (years grown of N), from the financials series", "Durable compounding beats one lumpy YoY print; falls back to YoY when history is thin"],
  ["Quality", "ROCE and cash conversion (FCF/PAT) lead, plus ROE and margins", "ROCE is the capital-efficiency metric Indian investors rank on; cash conversion catches accounting-only profit"],
  ["Momentum", "Price vs 50/200-DMA, golden/death cross, 3M return, RSI(14) zone, 52w-high proximity", "The market's own vote; highest pillar weight (20%)"],
  ["Fin. Strength", "Debt/equity, cash coverage of debt", "Balance-sheet resilience in a downturn"],
  ["Sentiment", "Leads with analyst EPS-estimate revisions (up vs down, 30d) + consensus, then the dual-model AI headline read", "A hard signal (revisions) ahead of model tone; lexicon fallback when AI/coverage is absent"],
  ["Risk", "Annualised volatility, 52w drawdown, beta, leverage, institutional concentration", "Shown un-inverted: a HIGH risk score means MORE risk; it lowers the overall score"],
];

const GLOSSARY: Array<[string, Array<[string, string]>]> = [
  [
    "Valuation & Fundamentals",
    [
      ["P/E (TTM)", "Price ÷ trailing 12-month earnings per share. How many years of current profit you pay for the business."],
      ["P/B", "Price ÷ book value per share. Below ~1 can signal value or distress."],
      ["EPS", "Earnings per share · net profit divided by share count."],
      ["ROE", "Return on equity · profit generated per rupee of shareholder capital. >15% is generally strong."],
      ["ROCE", "Return on capital employed · EBIT ÷ (total assets − current liabilities). Debt-adjusted capital efficiency; the headline Indian quality metric. >15% is strong."],
      ["PEG", "P/E ÷ earnings growth %. Below 1 suggests growth is cheap relative to the multiple paid."],
      ["FCF / Cash conversion", "Free cash flow = operating cash flow − capex. Cash conversion = FCF ÷ net profit; low or negative conversion means profit isn't turning into cash."],
      ["Debt/Equity", "Total debt ÷ shareholder equity. Above ~2x is heavily leveraged."],
      ["Market cap (Cr)", "Total value of all shares. 1 crore = 10 million; ₹1 lakh Cr ≈ $12B."],
      ["Dividend yield", "Annual dividends ÷ price, in %."],
      ["Promoter / Institutional holding", "Founders' stake vs FII+DII+MF stake. Sharp promoter-stake drops are a red flag."],
    ],
  ],
  [
    "Technical Analysis",
    [
      ["50/200-DMA", "Average close over the last 50/200 trading days. Price above both = uptrend."],
      ["Golden / Death cross", "50-DMA crossing above (golden) or below (death) the 200-DMA · regime-change signal."],
      ["RSI (14)", "Momentum oscillator 0 to 100. >70 overbought, <30 oversold, 45 to 65 healthy trend zone."],
      ["MACD", "Difference between 12 and 26-period EMAs vs its 9-period signal · momentum direction."],
      ["Support / Resistance", "Price zones where buying/selling has repeatedly appeared (recent 60-session extremes here)."],
      ["52-week high/low", "One-year price extremes; distance from them measures trend health and drawdown."],
      ["Volume", "Shares traded. Moves on high volume carry more conviction."],
      ["Annualised volatility", "Standard deviation of daily returns × √252 · how violently the stock swings."],
    ],
  ],
  [
    "Intraday & Derivatives",
    [
      ["Pivot points", "Levels computed from the prior session's High/Low/Close: P=(H+L+C)/3, with R1 to R3 above and S1 to S3 below."],
      ["CPR", "Central Pivot Range · band between BC=(H+L)/2 and TC=2P−BC. Narrow CPR often precedes a trend day."],
      ["Opening Range (OR)", "First 15 minutes' high/low. Breakouts beyond it define early bias."],
      ["20-EMA (5m)", "Fast intraday trend filter; price holding above it supports longs."],
      ["Lot size", "Minimum contract quantity for futures/options (e.g. NIFTY 75). Changes by exchange circular."],
      ["ATM option", "Strike nearest the current price · moves roughly half as fast as the index (delta ≈ 0.5)."],
      ["Risk:Reward", "Points to target ÷ points to stop. Below 1:1 means risking more than the expected gain."],
    ],
  ],
  [
    "Market Structure & Flows",
    [
      ["FII / FPI", "Foreign institutional investors. Their net buy/sell (₹ Cr) is published nightly by NSE."],
      ["DII", "Domestic institutions · mutual funds, insurers. Often the counterweight to FII flows."],
      ["Advance / Decline", "Count of rising vs falling stocks · market breadth. Rallies on weak breadth are fragile."],
      ["India VIX", "Implied volatility of NIFTY options · the market's fear gauge. >20 is elevated."],
      ["Sector rotation / RRG", "Money moving between sectors. The Rotation page ranks each sector by relative strength vs NIFTY and plots it on a Relative Rotation Graph: Improving → Leading → Weakening → Lagging."],
      ["Relative strength (RS)", "A sector or stock's return minus the benchmark's over the same window. Positive RS = outperforming the market."],
      ["Bulk / Block deal", "Large prints NSE publishes by name. Bulk = >0.5% of equity in a day; Block = negotiated-window trade. Big institutional buys/sells often precede multi-week moves."],
    ],
  ],
  [
    "Intelligence, AI & Projections",
    [
      ["Intelligence Score", "0 to 100 overall from seven explainable pillars; the stance chip (Constructive/Balanced/Cautious) is derived from it, never the reverse."],
      ["Pillar", "One scored dimension (Valuation, Growth, Quality, Momentum, Fin. Strength, Sentiment, Risk). Hover any bar to see the exact data that produced it."],
      ["AI sentiment", "An NLP read of ~20 recent headlines that weighs materiality (results, guidance, orders, ratings) over routine coverage · more reliable than keyword counting."],
      ["Scenario range", "Base/bull/bear target prices over a horizon from the dual-model AI blended with the detected pattern. Explicitly a scenario of how the move could play out if conditions hold — NOT a forecast or price target."],
      ["Estimate revisions", "The count of analysts raising vs cutting their EPS estimate over the last 30 days. Net upgrades is a leading bullish signal; it leads the Sentiment pillar."],
      ["Pattern read", "Auto-detected chart structures · triangles, wedges, channels, double tops/bottoms · drawn with their rails extended to the breakout zone and an explicit trigger level + measured-move target."],
      ["Results reaction", "How the stock actually moved across each of its last 8 earnings prints (close before → first close after), with the average, hit-rate and typical swing."],
      ["EPS surprise", "Reported earnings per share vs the street estimate · a beat (actual above) or miss (below), shown as a percentage."],
    ],
  ],
  [
    "IPO",
    [
      ["DRHP", "Draft Red Herring Prospectus · the filing with financials and the all-important Risk Factors section."],
      ["OFS vs Fresh issue", "OFS: existing holders sell (no money to company). Fresh: new shares fund the business."],
      ["GMP", "Grey-market premium · unofficial pre-listing price signal. Illiquid and frequently wrong."],
      ["Listing gain", "Day-one pop vs issue price."],
      ["Price band / Issue size", "Offer price range and total amount raised."],
    ],
  ],
];

const MODULES: Array<[string, string, string]> = [
  // [code, module, what it does]
  ["HOME", "Dashboard", "Indices (clickable, with sparklines), watchlist strip, NIFTY 50 movers, Top Picks scan, Market Pulse (global tape + FII/DII + anomalies), breadth, sector bars."],
  ["MKT", "Markets", "Every NSE index · click to expand constituents; top movers; sector chart; live bulk & block deals."],
  ["SCRN", "Screener", "Filter & rank the ~130-name universe on valuation/quality/growth/momentum with transparent factor sub-scores; 6 preset screens (Quality compounders, Value, Growth leaders, Momentum, Low-debt high-ROE) + custom filters."],
  ["ROTN", "Sector Rotation", "Relative strength of the 12 sector indices vs NIFTY across 1M/3M/6M, placed on a Relative Rotation Graph (Leading/Weakening/Lagging/Improving) so you see leadership moving early."],
  ["INTR", "Intraday", "Index-derivative levels: 5-min chart with pivots/CPR/opening-range, a rule-based trade plan with entry/stop/targets drawn on the chart, and per-lot P&L."],
  ["EARN", "Earnings", "Upcoming NIFTY-50 results calendar; expand a row for an AI results brief + the last-8-prints reaction history and EPS surprises."],
  ["COMP", "Compare", "Up to four stocks side-by-side: fundamentals table + 1-year relative performance rebased to 100."],
  ["IPO", "IPOs", "Pipeline dossiers · valuation, structure, DRHP risk flags, expected listing-gain setup, live news per name."],
  ["CMDT", "Commodities", "Global futures + Indian ETFs in ₹/unit; click any row for the full research view."],
  ["PORT", "Portfolio", "Browser-local holdings for live P&L, plus Risk & Exposure: sector exposure, concentration (top-5, effective positions), contribution to P&L and portfolio beta computed vs NIFTY from 1y returns."],
  ["WLST", "Watchlist", "Tracked securities with live quotes, a 'what changed today' signal feed (3%+ movers, 52-week extremes) and browser-side price alerts (crosses above / drops below) evaluated against the live feed."],
  ["NWS", "News", "Aggregated Indian market coverage with topic filters and search."],
  ["STK", "Stock research", "Per security: chart with scenario projection + breakout patterns, Intelligence Score, multi-year Financials (ROCE/FCF/cash conversion), Peer comparison vs sector, Analyst estimates & revisions, management commentary + reactions, news."],
];

function SectionTable({ rows, headers }: { rows: string[][]; headers: string[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-border bg-secondary/20 text-left text-[9px] uppercase tracking-wider text-muted-foreground">
            {headers.map((h) => (
              <th key={h} className="px-2.5 py-1.5 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((r, i) => (
            <tr key={i} className="align-top">
              {r.map((cell, j) => (
                <td
                  key={j}
                  className={
                    j === 0
                      ? "whitespace-nowrap px-2.5 py-1.5 font-medium"
                      : "px-2.5 py-1.5 text-muted-foreground"
                  }
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function GuidePage() {
  return (
    <div className="space-y-2 p-2">
      <PageHeader
        icon={BookOpen}
        code="HELP"
        title="Terminal Guide"
        subtitle="How the platform works · data sources · scoring methodology · glossary"
      />

      <div className="stagger grid grid-cols-1 gap-2 xl:grid-cols-2">
        <Panel code="ARCH" title="How the backend works" className="xl:col-span-2">
          <div className="space-y-2 p-3 text-[11.5px] leading-relaxed text-foreground/90">
            <p>
              Every number on this terminal flows through a <b>server-side data gateway</b>. The
              browser never talks to NSE or Yahoo directly · it calls our own <span className="num">/api/*</span> routes,
              which fetch upstream, normalise the shapes, cache with{" "}
              <b>stale-while-revalidate</b> semantics (you get the cached value instantly while a
              fresh one loads behind the scenes), and fall back across sources when one is blocked
              · e.g. indices try NSE first (real-time) and silently degrade to Yahoo (≤15-min
              delay) if NSE refuses.
            </p>
            <p>
              The frontend polls those routes with TanStack Query on per-data-class intervals
              (quotes 20 to 60s, flows 2min, news 5min, fundamentals 6h), so panels stay alive
              without a page refresh. Charts are rendered by lightweight-charts (price/time
              series) and Recharts has been replaced by hand-built CSS visuals for the dense
              panels; state like your watchlist and portfolio persists in your browser via Zustand.
            </p>
          </div>
        </Panel>

        <Panel code="AI" title="AI layer · how it's used & what it costs" className="xl:col-span-2">
          <div className="space-y-2 p-3 text-[11.5px] leading-relaxed text-foreground/90">
            <p>
              An optional LLM layer runs through <b>OpenRouter</b> with a deliberate two-tier
              split so cost stays near-zero. A <b>free model</b> ($0 in/out) does the high-volume
              work · the materiality-weighted <b>news-sentiment NLP</b> that feeds the Sentiment
              pillar and the chart scenario, plus the three-part <b>earnings briefs</b>. A{" "}
              <b>two-model paid ensemble</b> (deepseek-v4-flash + gpt-4o-mini, averaged) is reserved
              for the places deep synthesis pays off: the technical/sentiment read behind the
              base/bull/bear scenario and the Intelligence Score <b>analyst note</b> that reconciles
              all seven pillars with the technical and news picture.
            </p>
            <p>
              The paid tier is capped by a <b>daily token budget</b> (default 1,000,000
              tokens/day, resets at IST midnight). Each note costs ~1,000 tokens, so realistic use
              is a fraction of a rupee per day; the worst case at the cap is ~₹11/day. Once the
              budget is spent, paid calls <b>silently downgrade to the free model</b> · analysis
              never stops. Live budget headroom is exposed at{" "}
              <span className="num">/api/llm-status</span>. With no keys configured at all, every
              feature falls back to its deterministic non-AI version, and the labels in each panel
              header tell you which mode produced what you're reading.
            </p>
          </div>
        </Panel>

        <Panel code="NAV" title="Platform modules" className="xl:col-span-2">
          <div className="grid grid-cols-1 gap-x-5 gap-y-1.5 p-3 md:grid-cols-2">
            {MODULES.map(([code, name, desc]) => (
              <div key={code} className="flex gap-2 text-[11px] leading-snug">
                <span className="num shrink-0 rounded-[2px] bg-primary/10 px-1 py-px text-[9px] font-semibold tracking-widest text-primary">
                  {code}
                </span>
                <span>
                  <b className="text-foreground">{name}</b>{" "}
                  <span className="text-muted-foreground">· {desc}</span>
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel code="DATA" title="Data sources & freshness" className="xl:col-span-2">
          <SectionTable
            headers={["Section", "Source & fallback", "Refresh", "Freshness", "Notes"]}
            rows={SOURCES}
          />
        </Panel>

        <Panel code="INTL" title="Intelligence Score · methodology" className="xl:col-span-2">
          <div className="p-3">
            <p className="mb-2 text-[11.5px] leading-relaxed text-foreground/90">
              We deliberately avoid one-word Buy/Sell labels. Each security gets an{" "}
              <b>overall score out of 100</b> built from seven pillars; every pillar shows the
              exact data points that produced it (hover any pillar bar). The overall score is a
              weighted mean · Momentum 20%, Valuation/Growth/Quality 15% each, Risk 15%
              (inverted: high risk pulls the score down), Strength and Sentiment 10% each ·
              re-weighted over whichever pillars have data. The stance chip (Constructive ≥68 ·
              Balanced 45 to 67 · Cautious &lt;45) is <b>derived from</b> the score, never the other
              way around.
            </p>
            <SectionTable headers={["Pillar", "What feeds it", "How to read it"]} rows={PILLARS} />
          </div>
        </Panel>

        {GLOSSARY.map(([section, terms]) => (
          <Panel key={section} code="TERM" title={section}>
            <dl className="divide-y divide-border/60">
              {terms.map(([term, def]) => (
                <div key={term} className="flex gap-3 px-3 py-1.5">
                  <dt className="num w-36 shrink-0 text-[11px] font-medium text-primary">{term}</dt>
                  <dd className="text-[11px] leading-snug text-muted-foreground">{def}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        ))}

        <Panel code="READ" title="How to read the terminal" className="xl:col-span-2">
          <div className="grid grid-cols-1 gap-x-6 gap-y-2 p-3 text-[11px] leading-relaxed text-muted-foreground md:grid-cols-2">
            <p><b className="text-foreground">Function codes</b> · the amber tags (IDX, PULS, INTL…) identify each module, Bloomberg-style. Green is always bullish/positive, red bearish/negative, amber neutral/attention.</p>
            <p><b className="text-foreground">Timestamps</b> · every panel header shows when its data was last fetched and its refresh cadence. If something looks stale, the timestamp will say so.</p>
            <p><b className="text-foreground">⌘K</b> · global search from anywhere; type any NSE/BSE name or symbol. Click any symbol anywhere to open its full research view.</p>
            <p><b className="text-foreground">Flashes</b> · price cells flash green/red as live ticks arrive, so you can see the tape moving without reading every number.</p>
            <p><b className="text-foreground">Intraday WAIT</b> · when the plan says WAIT, that is the advice: the engine found no edge inside the CPR band and gives you the breakout levels to watch instead.</p>
            <p><b className="text-foreground">Everything is educational</b> · free, partly delayed data, rule-based analytics, no SEBI registration. Verify with your broker before acting.</p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
