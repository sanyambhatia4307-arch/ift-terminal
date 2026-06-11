# Setup & Research Report — Indian Financial Intelligence Terminal

Date: 2026-06-12 · Machine: macOS (Darwin 25.6.0) · All endpoint results below were **live-verified from this machine**, not assumed.

---

## 1. Tooling Verification

| Tool | Status | Version | Notes |
|---|---|---|---|
| Node.js | ✅ Installed | v24.3.0 | Node 24 is the active LTS line — no action needed |
| npm | ✅ Installed | 11.4.2 | |
| pnpm | ✅ **Installed during setup** | 11.6.0 | Activated via corepack |
| Git | ✅ Installed | 2.50.1 (Apple Git-155) | Repo will be initialized in this directory |
| TypeScript | ✅ Project-local | 5.x via project deps | Global `tsc` intentionally not installed; per-project is best practice |
| Next.js tooling | ✅ Via `create-next-app` | Next 15 (App Router) | Exceeds the "14+" requirement |
| Internet access | ✅ Working | — | curl + WebSearch + WebFetch all functional |
| Browser automation | ✅ Available | Claude Preview MCP + Chrome MCP | Will be used for end-to-end visual verification |
| Web research | ✅ Available | WebSearch / WebFetch / Bright Data plugin | Used for data-source research |

**Missing dependencies: none.** Everything required is installed or project-local.

## 2. Data Source Research (live-verified)

### Tier 1 — Primary sources (verified working)

| Source | Endpoint | Status | What it gives | Constraints |
|---|---|---|---|---|
| **Yahoo Finance v8 chart** | `query1.finance.yahoo.com/v8/finance/chart/{SYM}.NS` | ✅ 200, no auth | Real-time-ish quotes, OHLCV history (1m–max), index data (`^NSEI`, `^BSESN`), meta (52w range, prev close) | Unofficial; ~15min delay for NSE quotes; be gentle (≤ ~2 req/s); UA header required |
| **Yahoo Finance search** | `/v1/finance/search?q=` | ✅ 200, no auth | Symbol lookup for global search | Same as above |
| **Yahoo quoteSummary (fundamentals)** | `/v10/finance/quoteSummary/...` | ⚠️ 401 raw, ✅ works with crumb+cookie | P/E, market cap, financials, margins, holders | Requires cookie+crumb handshake — solved by `yahoo-finance2` npm package server-side |
| **NSE public API** | `nseindia.com/api/allIndices`, `/api/marketStatus` | ✅ 200 direct | All indices live (incl. advance/decline, P/E, P/B, div yield per index), market open/close status | Akamai-protected; some endpoints work bare, others need cookie handshake from a landing page; server-side only, rotate session every ~5 min |
| **NSE protected endpoints** | `/api/equity-stockIndices`, `/api/quote-equity`, `/api/option-chain-indices` | ⚠️ Need cookie session | Constituent-level moves (gainers/losers), depth, delivery %, option chain | Cookie jar + Referer + browser UA; fragile — must have Yahoo fallback |
| **BSE API** | `api.bseindia.com/BseIndiaAPI/api/...` | ✅ 200 with `Referer: bseindia.com` | Corporate announcements, corp actions, index data | Undocumented but stable for years |
| **Google News RSS** | `news.google.com/rss/search?q=...&gl=IN&ceid=IN:en` | ✅ 200 | Per-stock and market news, free, no key | Headline + link + source only; ~quasi-unlimited at low volume |
| **ET Markets RSS** | `economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms` | ✅ 200 | Curated Indian market news | Free |
| **Screener.in** | `screener.in/company/{SYM}/` | ✅ 200 | Fundamentals, ratios, shareholding (HTML scrape) | Respect robots/rate; use as enrichment, not hot path |
| **RBI / DBIE** | `rbi.org.in`, `data.rbi.org.in` | ✅ 200 | Policy rates, macro series | Slow-moving data; cache for hours |
| **data.gov.in** | ✅ 200 | Government datasets (free API key) | Macro/econ enrichment | Registration for key |

### Not usable / rejected

- **Yahoo v7 `/finance/quote`** — 401 since 2023 crumb enforcement; superseded by v8 chart meta + `yahoo-finance2`.
- **Moneycontrol RSS** — 403 (bot-blocked at network level here). Google News covers the same stories.
- **Broker APIs (Upstox, Breeze, Kite)** — free but require account + login + (from Apr 2026) static IP for trading APIs. Wrong fit for a no-login terminal; documented as a future upgrade path. ([Breeze](https://www.icicidirect.com/futures-and-options/api/breeze), [Upstox](https://upstox.com/trading-api/))
- **Paid feeds (TrueData, Global Datafeeds)** — explicitly out of scope per requirements.

### Useful prior art
- [`stock-nse-india`](https://github.com/hi-imcodeman/stock-nse-india) and [`nse-js`](https://github.com/0xSaurabhx/nse-js) — Node NSE clients showing the cookie-handshake pattern (we implement our own lightweight version, no extra dependency risk).
- [`yahoo-finance2`](https://www.npmjs.com/package/yahoo-finance2) — battle-tested crumb handling for quoteSummary; we use it server-side.

### Rate-limit & reliability strategy
- **All third-party calls happen server-side** (Next.js route handlers) — never from the browser. This hides headers/cookies, lets us cache once for all users, and avoids CORS.
- **TTL cache per data class:** quotes/indices 15–30s during market hours, movers 60s, news 5 min, fundamentals 6h, macro 24h. Stale-while-revalidate so the UI never blocks.
- **Fallback chain:** NSE → Yahoo for indices/quotes; Google News → ET RSS for news. A source failing degrades gracefully instead of blanking panels.
- **Market-hours awareness:** refresh intervals slow down automatically when NSE is closed (verified `marketStatus` endpoint tells us).

## 3. Recommended Architecture

```
Browser (React 19, App Router)
 ├─ TanStack Query: polling w/ market-hours-aware refetchInterval, SWR semantics
 ├─ Zustand (persisted): watchlist, UI prefs
 ├─ lightweight-charts: price/candle charts   ├─ Recharts: sector/breadth visuals
 └─ shadcn/ui + Tailwind: dense dark terminal UI
        │  /api/* (same origin)
Next.js Route Handlers — "Data Gateway"
 ├─ lib/sources/nse.ts     (cookie session mgr + typed endpoints)
 ├─ lib/sources/yahoo.ts   (v8 chart + yahoo-finance2 fundamentals)
 ├─ lib/sources/bse.ts     (referer-header client: announcements)
 ├─ lib/sources/news.ts    (Google News + ET RSS → normalized)
 ├─ lib/cache.ts           (in-memory TTL + stale-while-revalidate)
 └─ lib/fallback.ts        (ordered source chains)
```

Key decisions:
1. **Next 15 over 14** — same App Router model, current and supported; requirement said 14+.
2. **No database in v1** — all data is fetched+cached; watchlist persists client-side. Keeps deploy trivial; a DB slots in later for portfolios/alerts without rework.
3. **Module-per-source adapters with one normalized type layer** (`types/market.ts`) — future modules (earnings intelligence, sentiment, peer comp) consume normalized types, not source quirks.
4. **Polling over WebSockets** — no free Indian WS feed exists without broker login; 15–30s polling against cached gateway is indistinguishable for a free-data terminal and far more reliable.

## 4. Risks & Limitations

| Risk | Severity | Mitigation |
|---|---|---|
| NSE blocks/changes unofficial API | High likelihood, medium impact | Yahoo fallback for everything critical; adapters isolated so fixes are one-file |
| Yahoo data ~15 min delayed for NSE | Inherent | Label data freshness in UI ("as of HH:MM"); NSE direct is real-time when available |
| quoteSummary crumb churn | Medium | `yahoo-finance2` maintains the handshake; pinned version + graceful degradation |
| Scraping ToS gray area | Legal/etiquette | Low request volume, server cache, public read-only data, respect robots; no redistribution business |
| In-memory cache resets on redeploy | Low | Acceptable; cold-start refetch is seconds |
| Single-user local app assumptions | Low | Gateway design already multi-user-safe (shared cache) |

## 5. Critique of Original Requirements & Improvements Adopted

**Strengths of the brief:** correct stack for the job; dark dense terminal aesthetic is the right call; server-side data gateway implied by "multiple checkpoints and fallbacks" is exactly how Koyfin-class products work.

**Weaknesses identified → what I'm doing instead:**
1. *"Real-time" expectation vs free-data reality* — free NSE-derived data is 0–15 min delayed. The honest, professional move is a visible freshness timestamp on every panel (Bloomberg shows data age; student dashboards hide it).
2. *Feature breadth risk* — the vision lists ~10 future modules. v1 ships the core loop (dashboard → search → stock research → watchlist → news) at high polish rather than 10 shallow pages. The adapter/type architecture makes the rest additive.
3. *Recharts + lightweight-charts overlap* — both are required; the split that avoids mess: **lightweight-charts for anything time-series price**, **Recharts for categorical/analytics** (sector bars, breadth). Documented as a convention.
4. *Market breadth* — NSE's `allIndices` already returns advances/declines per index; we get genuine breadth without scraping anything extra. Added to dashboard.
5. *Added beyond spec:* market-hours-aware refresh (don't hammer sources at 2 AM), ⌘K command-palette search (terminal muscle memory), per-index P/E–P/B–dividend-yield context (NSE provides it free — real "intelligence, not data display").

## 6. Roadmap

- **v1 (this build):** App shell + ticker + ⌘K search · Dashboard (status, indices, movers, sectors, breadth, news, watchlist strip) · Stock research page (chart, key stats, fundamentals, news) · Markets, News, Watchlist pages · Data gateway with cache+fallbacks.
- **v1.x:** BSE announcements feed per stock, Screener.in shareholding/ratios enrichment, index constituents heatmap.
- **v2:** Portfolio analytics (needs DB), earnings calendar intelligence, peer comparison engine, RBI macro dashboard, sentiment scoring on news flow, AI research assistant over the normalized data layer.
