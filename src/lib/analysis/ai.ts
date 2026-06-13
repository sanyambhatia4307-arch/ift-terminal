import { runEnsemble, type EnsembleModelView, type EnsembleResult } from "@/lib/analysis/llm";
import { detectShape } from "@/lib/analysis/patterns";
import { computeIndicators } from "@/lib/analysis/technical";
import { cached } from "@/lib/cache";
import { getChart, getFundamentals, getNews } from "@/lib/market";

/**
 * One shared AI analysis per security: both paid models judge technical posture
 * and sentiment together, returning averaged projections. The Intelligence
 * Score and the chart projection both consume this single cached result so the
 * dual-model call happens once per symbol per window.
 */

export interface AiAnalysis {
  symbol: string;
  source: EnsembleResult["source"];
  horizonSessions: number;
  sentiment: number; // -1..1
  technicalBias: number; // -1..1
  baseReturnPct: number; // over horizonSessions
  bullReturnPct: number;
  bearReturnPct: number;
  confidence: number;
  models: EnsembleModelView[];
  generatedAt: number;
}

const HORIZON = 45; // ~2 trading months, the reference horizon for AI returns

async function build(symbol: string): Promise<AiAnalysis> {
  const chart = await getChart(symbol, "1y", "1d");
  const t = computeIndicators(chart.candles);
  const shape = detectShape(chart.candles);

  let name = symbol;
  const fundamentals: Record<string, unknown> = {};
  try {
    const f = await getFundamentals(symbol);
    name = f.name ?? symbol;
    if (f.sector) fundamentals.sector = f.sector;
    if (f.trailingPE != null) fundamentals.pe = Math.round(f.trailingPE * 10) / 10;
    if (f.returnOnEquity != null) fundamentals.roe_pct = Math.round(f.returnOnEquity * 1000) / 10;
    if (f.revenueGrowth != null) fundamentals.rev_growth_pct = Math.round(f.revenueGrowth * 1000) / 10;
    if (f.targetMeanPrice != null && t)
      fundamentals.analyst_upside_pct = Math.round(((f.targetMeanPrice - t.last) / t.last) * 1000) / 10;
  } catch {
    // index / ETF / commodity: no fundamentals
  }

  let headlines: string[] = [];
  try {
    headlines = (await getNews(`${name} stock`)).slice(0, 18).map((n) => n.title);
  } catch {
    // news down
  }

  const technicals = t
    ? {
        last: t.last,
        rsi14: t.rsi14 != null ? Math.round(t.rsi14) : undefined,
        return_1m_pct: t.return1M != null ? Math.round(t.return1M * 10) / 10 : undefined,
        return_3m_pct: t.return3M != null ? Math.round(t.return3M * 10) / 10 : undefined,
        vs_50dma: t.sma50 ? (t.last > t.sma50 ? "above" : "below") : undefined,
        vs_200dma: t.sma200 ? (t.last > t.sma200 ? "above" : "below") : undefined,
        support: t.support,
        resistance: t.resistance,
        annualised_vol_pct: t.annualizedVolatility != null ? Math.round(t.annualizedVolatility) : undefined,
        pct_from_52w_high: t.pctFrom52wHigh != null ? Math.round(t.pctFrom52wHigh * 10) / 10 : undefined,
      }
    : {};

  const ens = await runEnsemble({
    security: name,
    horizonSessions: HORIZON,
    technicals,
    fundamentals,
    patternShape: shape?.shape,
    headlines,
  });

  return {
    symbol,
    source: ens.source,
    horizonSessions: HORIZON,
    sentiment: ens.sentiment,
    technicalBias: ens.technicalBias,
    baseReturnPct: ens.baseReturnPct,
    bullReturnPct: ens.bullReturnPct,
    bearReturnPct: ens.bearReturnPct,
    confidence: ens.confidence,
    models: ens.models,
    generatedAt: Date.now(),
  };
}

export function getAiAnalysis(symbol: string): Promise<AiAnalysis> {
  return cached(`ai-analysis:${symbol}`, 10 * 60 * 1000, () => build(symbol));
}
