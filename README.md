# IFT — Indian Financial Intelligence Terminal

An institutional-grade market intelligence terminal for Indian equities. Dark, dense, Bloomberg/Koyfin-style UI with live free-data feeds from NSE, BSE, Yahoo Finance, and Indian financial news RSS.

## Features

- **Dashboard** — major indices with P/E, P/B and dividend yield context, watchlist strip, NIFTY 50 top gainers/losers, market breadth, sector performance, breaking news. Auto-refreshes (indices 30s, movers 60s, news 5 min).
- **Stock research** (`/stock/SYMBOL`) — candlestick + volume chart (1D→MAX), fundamentals and key ratios (valuation, profitability, balance sheet, ownership, street consensus), company news, watchlist toggle.
- **Markets** — all NSE indices table, movers, sector heat chart.
- **News** — aggregated Google News (India) + ET Markets feeds with topic tabs and search.
- **Watchlist** — persisted locally, live quote table.
- **⌘K global search** — NSE/BSE symbol lookup from anywhere.
- Live NSE market status + IST clock, scrolling index ticker tape.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui · TanStack Query · Zustand · lightweight-charts · Recharts · Axios · date-fns · Lucide.

## Architecture

All upstream calls happen server-side through a data gateway (`src/app/api/*` → `src/lib/market.ts`):

- `src/lib/sources/nse.ts` — NSE public API with Akamai cookie-session handling.
- `src/lib/sources/yahoo.ts` — Yahoo v8 chart API + `yahoo-finance2` fundamentals.
- `src/lib/sources/news.ts` — RSS aggregation with dedupe.
- `src/lib/cache.ts` — in-memory TTL cache with stale-while-revalidate.
- Fallback chains: NSE → Yahoo for indices/movers, so a blocked source degrades gracefully instead of blanking the UI.

Convention: **lightweight-charts** for price/time-series, **Recharts** for categorical analytics.

## Run

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # production build
```

## Data honesty

All sources are free/unofficial: NSE quotes are real-time when reachable, Yahoo-derived data may be delayed up to 15 minutes. Panels show data-source and refresh timestamps. See `SETUP_REPORT.md` for the full source research, rate-limit strategy, and risk register.
