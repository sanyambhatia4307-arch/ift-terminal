# IFT — Indian Financial Intelligence Terminal

An institutional-grade market intelligence terminal for Indian equities. Dark Bloomberg-style UI, dense data panels, live free-data feeds (NSE, Yahoo Finance, RSS), and a dual-model AI layer that reads charts and news.

- **Live:** https://ift-terminal.onrender.com
- **Repo:** https://github.com/sanyambhatia4307-arch/ift-terminal
- **Local path:** `/Users/sanyambhatia/Documents/Finance Project`

> This README doubles as a handoff doc. If you are a fresh agent or chat picking this up, read **Current state**, **Local dev setup** and **Data sources & gotchas** before touching anything.

---

## Current state

Everything described below is built, verified live, and deployed. Last deployed commit: `ab15d25`.

The project went through an "elite investor panel" audit that drove a full P1 to P3 roadmap to completion: idea discovery, research depth, portfolio risk, sector rotation, options/OI and shareholding all shipped. There is **no outstanding feature work** from that audit.

### Two things a new chat will hit immediately

**1. The local git repo is broken.** `.git` is missing; the old one is parked at `.git-stalled`. Cause: the project lives in `~/Documents`, which is **iCloud-synced**, and iCloud evicted git's internal files (`mmap failed: Operation timed out`). GitHub is the source of truth and is fully up to date. To restore:

```bash
cd /private/tmp && rm -rf ift-recover
git clone https://github.com/sanyambhatia4307-arch/ift-terminal.git ift-recover
mv ift-recover/.git "/Users/sanyambhatia/Documents/Finance Project/.git"
cd "/Users/sanyambhatia/Documents/Finance Project" && git status
```

**Better long-term fix:** move the project out of iCloud (e.g. to `~/Projects/ift-terminal`). Recommended, not yet done.

**2. If git keeps stalling, deploy via a scratch clone.** Clone to `/private/tmp`, copy changed files in, commit, push from there. That is how `ab15d25` shipped.

---

## Feature set

| Page | What it does |
|---|---|
| **Dashboard** (`/`) | Market mood band, breadth gauge, NIFTY heatmap, movers, top picks, global pulse (FII/DII, VIX, anomalies), sector bars |
| **Markets** | All NSE indices (expandable to constituents), movers, sector chart, bulk and block deals |
| **Screener** | ~130-name universe filtered and ranked on Value/Quality/Growth/Momentum sub-scores plus a composite. 6 preset screens, custom numeric filters, sortable table |
| **Rotation** | Relative strength of 12 sector indices vs NIFTY (1M/3M/6M) plotted on an RRG quadrant chart (Leading, Weakening, Lagging, Improving) |
| **Intraday** | 5-min index chart with pivots/CPR/opening range, rule-based trade plan drawn on the chart, per-lot P&L, plus an **Options/OI panel** (PCR, max pain, OI walls) |
| **Stock** (`/stock/SYM`) | Chart with AI scenario and breakout patterns, Intelligence Score, multi-year Financials (ROCE, FCF, cash conversion), Peer comps, Analyst estimates and revisions, Shareholding, management commentary, results reactions, news |
| **Earnings** | Results calendar, AI results brief, last-8-prints reaction history and EPS surprises |
| **Compare** | Up to 4 stocks: fundamentals table plus rebased 1Y performance |
| **IPOs** | Pipeline dossiers, DRHP risk flags, live per-name news |
| **Commodities** | Global futures and Indian ETFs in ₹/unit, expandable research view |
| **Portfolio** | Browser-local holdings, live P&L, plus **Risk and Exposure** (sector exposure, concentration/HHI, contribution to P&L, computed NIFTY beta) |
| **Watchlist** | Live quotes, "what changed today" signals, browser-side price alerts |
| **Guide** | Architecture, data sources and freshness, scoring methodology, glossary. **Keep this updated when features change.** |

### Investment Intelligence Framework

Seven explainable pillars scored 0 to 100, with no black-box Buy/Sell label. Four are backed by real fundamental data:

- **Valuation** — P/E and P/B scored *relative to the sector median* (not absolute) plus PEG
- **Quality** — leads with **ROCE** and **cash conversion** (FCF/PAT), then ROE and margins
- **Growth** — multi-year revenue and earnings **CAGR plus consistency**, not one noisy YoY print
- **Sentiment** — leads with **analyst estimate revisions** (30d up vs down), then the AI read
- Momentum, Financial Strength, Risk — technical and balance-sheet driven

---

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript (strict) · Tailwind CSS 4 · shadcn/ui · TanStack Query · Zustand · lightweight-charts · motion · yahoo-finance2 · fast-xml-parser

Fonts: **Geist** (sans) and **IBM Plex Mono** (all numerals, tabular).

---

## Architecture

**Golden rule: the browser never talks to an upstream source.** Everything flows through a server-side data gateway.

```
Browser → /api/* (route handlers) → src/lib/market.ts → src/lib/sources/* → upstream
                                          ↑
                                   src/lib/cache.ts (TTL + stale-while-revalidate)
```

### Key files

| File | Role |
|---|---|
| `src/lib/market.ts` | The gateway. All cached getters (`getQuotes`, `getFundamentals`, `getFinancials`, `getEstimates`, `getOptionChain`, `getShareholding`, and more) |
| `src/lib/cache.ts` | In-memory TTL cache plus `firstOf()` fallback chains |
| `src/lib/sources/nse.ts` | NSE public API with Akamai cookie-session handling |
| `src/lib/sources/yahoo.ts` | Yahoo quotes, charts, fundamentals, `fundamentalsTimeSeries`, `earningsTrend` |
| `src/lib/sources/news.ts` | Google News and ET Markets RSS, deduped |
| `src/lib/analysis/engine.ts` | The 7-pillar Intelligence Framework |
| `src/lib/analysis/llm.ts` | Dual-model paid ensemble and free tier, shared daily token budget |
| `src/lib/analysis/patterns.ts` | Geometric pattern detection (triangles, wedges, channels, double tops) with breakout trigger levels |
| `src/lib/analysis/forecast.ts` | Base/bull/bear **scenario** ranges (explicitly not a forecast) |
| `src/lib/analysis/rotation.ts` | Sector relative strength and RRG quadrant math |
| `src/lib/analysis/risk.ts` | Beta computed from 1y daily returns vs `^NSEI` |
| `src/lib/screener.ts` | Universe assembly and factor scoring; also exports `getSectorMedians()` used by the valuation pillar |
| `src/lib/tones.ts` | Semantic module colors (function code to hue) |
| `src/hooks/queries.ts` | Every TanStack Query hook |
| `src/app/globals.css` | Design tokens, dark theme, motion and interaction layer |

### Conventions

- Charts: **lightweight-charts** for price/time series. It **cannot parse `oklch()`**, so pass hex or rgba only.
- Panels: `<Panel code="XXXX" title="…">`. The `code` drives the module color via `tones.ts`, so add new codes there.
- Numbers: always `className="num"` (tabular mono).
- API routes return `{ ok, data }` via `handle()` in `src/lib/api-route.ts`.
- **No em-dashes or en-dashes anywhere in UI copy** (user preference). Use `·`, commas or parentheses. Mathematical minus signs on negative numbers are fine.

---

## Local dev setup

```bash
cd "/Users/sanyambhatia/Documents/Finance Project"
export PATH="/opt/homebrew/bin:$PATH"   # node is NOT on the default PATH
npm run dev                              # http://localhost:3000
```

- **Node 26.3.0 is installed via Homebrew** at `/opt/homebrew/bin/node`. There is no nvm or volta, and `node`, `npm`, `npx` are *not* on the sandbox's default PATH. Always export it first.
- The lockfile is `pnpm-lock.yaml` but **pnpm is not installed**. Use `npm`; it works fine.
- The preview/launch config lives in **`~/Documents/Claude Test/.claude/launch.json`** (the session's primary directory), not in this project. The `ift-dev` entry wraps the command in `/bin/zsh -c` with the PATH export. That wrapper is required, so do not revert it to bare `pnpm`.

### Environment (`.env.local`, gitignored)

```
OPENROUTER_API_KEY=sk-or-v1-…
OPENROUTER_FREE_MODEL=openai/gpt-oss-120b:free
OPENROUTER_PAID_MODEL_A=deepseek/deepseek-v4-flash
OPENROUTER_PAID_MODEL_B=openai/gpt-4o-mini
LLM_PAID_DAILY_TOKENS=1000000
```

With no keys set, every AI feature falls back to a deterministic non-AI version. The same variables are configured in the Render dashboard.

---

## Deployment

**GitHub to Render, fully automatic.** Push to `main` and Render rebuilds; live in roughly 2 to 5 minutes.

- Verify what is deployed: `curl https://ift-terminal.onrender.com/api/health` returns the deployed commit SHA.
- Render's free tier sleeps after ~15 minutes idle, so the first request then takes 30 to 60 seconds.
- Render runs **Node 24.14.1**; local is 26. No issues so far.
- **Vercel was removed.** No `vercel.json`, no `maxDuration` exports. Render runs a persistent server, so the in-memory cache and the NSE cookie session survive between requests, which is a real advantage over serverless.

---

## Data sources & gotchas

Hard-won lessons. **Do not re-discover these.**

| Source | Notes |
|---|---|
| **NSE** | Needs an Akamai cookie handshake (`src/lib/sources/nse.ts` handles it). Works fine from Render's IPs; the datacenter-blocking fear did not materialise. |
| **NSE option chain** | The old `/api/option-chain-indices` path **404s now**. Use `/api/option-chain-contract-info` for expiries, then `/api/option-chain-v3?type=Indices&symbol=X&expiry=Y`. |
| **NSE shareholding** | `/api/top-corp-info?symbol=X&market=equities` returns `shareholdings_patterns` with ~5 quarters of promoter/public holding. **Pledge % and the FII/DII split are NOT in this free feed**, and the UI says so honestly. |
| **Yahoo statements** | The legacy `incomeStatementHistory`, `balanceSheetHistory` and `cashflowStatementHistory` modules **went dark for `.NS` names in late 2024** (they return dates only). Use **`fundamentalsTimeSeries`** instead. |
| **Yahoo beta** | The vendor `beta` field for `.NS` names is unreliable; it produced a bogus 0.23 for a normal large-cap book. Beta is **computed in-house** in `src/lib/analysis/risk.ts`. |
| **BSE API** | `api.bseindia.com` is unreachable from this environment (`fetch failed`). Do not build on it. |
| **LLM budget** | Both paid models share one daily token cap. Once exhausted, calls silently downgrade to the free model. Check `/api/llm-status`. |

---

## Testing & verification

```bash
export PATH="/opt/homebrew/bin:$PATH"
find .next/types -name '* 2.ts' -delete   # stale iCloud duplicates cause bogus tsc errors, always clear first
npx tsc --noEmit
npm run build
```

Then verify behaviour in the browser (preview tools) or against the live URL. Check the console for errors before committing. Zero console errors is the standard held so far.

---

## Ideas not yet built

- Promoter **pledge %** and the FII/DII holding split (needs a non-Yahoo, non-BSE source)
- Estimate-revision *history* charting (currently a point-in-time count)
- Server-side persistent alerts or push notifications (currently browser-local)
- Moving the project out of iCloud (strongly recommended)

---

## Disclaimers

Free public data, with quotes delayed up to 15 minutes. All scoring is transparent and rule-based, and AI output is labelled as a **scenario, not a forecast**. Nothing here is investment advice or a SEBI-registered recommendation.
