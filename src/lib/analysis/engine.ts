import { getAiAnalysis, type AiAnalysis } from "@/lib/analysis/ai";
import type { EnsembleModelView } from "@/lib/analysis/llm";
import { computeIndicators, type TechnicalIndicators } from "@/lib/analysis/technical";
import { scoreNewsSentiment, type SentimentResult } from "@/lib/analysis/sentiment";
import { getChart, getFundamentals, getNews } from "@/lib/market";
import { getSectorMedians, type SectorMedians } from "@/lib/screener";
import type { FundamentalsData, NewsItem } from "@/types/market";

/**
 * Investment Intelligence Framework.
 *
 * No black-box Buy/Sell labels: each security is scored 0 to 100 across seven
 * explainable pillars, every pillar lists the exact data points that drove
 * it, and the overall score plus a derived stance roll up transparently.
 */

export type PillarKey =
  | "valuation"
  | "growth"
  | "quality"
  | "momentum"
  | "strength"
  | "sentiment"
  | "risk";

export interface PillarScore {
  key: PillarKey;
  name: string;
  /** 0 to 100. For `risk`, higher = MORE risk (UI inverts its color). */
  score: number;
  weight: number;
  drivers: string[];
  cautions: string[];
  available: boolean;
}

export interface AnalysisResult {
  symbol: string;
  name?: string;
  overallScore: number; // 0-100
  stance: "Constructive" | "Balanced" | "Cautious";
  confidence: "low" | "medium" | "high";
  pillars: PillarScore[];
  drivers: string[]; // top cross-pillar positives
  risks: string[]; // top cross-pillar negatives
  technicals: TechnicalIndicators;
  sentiment: SentimentResult;
  analyst: {
    consensus?: string;
    targetMeanPrice?: number;
    upsidePercent?: number;
    numberOfAnalysts?: number;
  };
  narrative: string;
  narrativeSource: "ai" | "rules";
  sentimentSource: "ai" | "lexicon";
  aiSource: "ensemble" | "free" | "none";
  modelViews: EnsembleModelView[];
  generatedAt: number;
}

const clamp100 = (n: number) => Math.round(Math.max(0, Math.min(100, n)));
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

interface PillarBuild {
  scores: number[];
  drivers: string[];
  cautions: string[];
}

function pillar(b: PillarBuild): { score: number; available: boolean } {
  if (b.scores.length === 0) return { score: 50, available: false };
  return {
    score: clamp100(b.scores.reduce((a, x) => a + x, 0) / b.scores.length),
    available: true,
  };
}

function valuationPillar(
  f: FundamentalsData | null,
  last: number,
  secMed?: SectorMedians | null
): PillarScore {
  const b: PillarBuild = { scores: [], drivers: [], cautions: [] };

  // P/E — scored RELATIVE to the sector median when available (a 38x quality
  // compounder is not "expensive" if its sector trades at 40x); falls back to
  // absolute bands only when no sector context exists.
  if (f?.trailingPE != null && f.trailingPE > 0) {
    const pe = f.trailingPE;
    if (secMed?.pe && secMed.pe > 0) {
      const rel = pe / secMed.pe; // <1 = cheaper than peers
      const s = rel < 0.7 ? 86 : rel < 0.9 ? 70 : rel < 1.1 ? 55 : rel < 1.4 ? 40 : 26;
      b.scores.push(s);
      const gap = (rel - 1) * 100;
      (s >= 55 ? b.drivers : b.cautions).push(
        `P/E ${pe.toFixed(1)}x · ${gap >= 0 ? "+" : ""}${gap.toFixed(0)}% vs sector median ${secMed.pe.toFixed(1)}x`
      );
    } else {
      const s = pe < 15 ? 82 : pe < 22 ? 68 : pe < 32 ? 52 : pe < 45 ? 38 : 24;
      b.scores.push(s);
      (s >= 60 ? b.drivers : b.cautions).push(
        `P/E ${pe.toFixed(1)}x · ${s >= 60 ? "reasonable vs broad-market norms" : "rich; growth must deliver"}`
      );
    }
  }

  // PEG — valuation in the context of growth (the compounder's defence).
  if (f?.trailingPE != null && f.trailingPE > 0 && f.earningsGrowth != null && f.earningsGrowth > 0) {
    const peg = f.trailingPE / (f.earningsGrowth * 100);
    const s = peg < 1 ? 86 : peg < 1.5 ? 68 : peg < 2.5 ? 50 : 32;
    b.scores.push(s);
    (s >= 55 ? b.drivers : b.cautions).push(`PEG ${peg.toFixed(2)} (P/E vs earnings growth)`);
  }

  if (f?.priceToBook != null && f.priceToBook > 0) {
    const pb = f.priceToBook;
    if (secMed?.pb && secMed.pb > 0) {
      const rel = pb / secMed.pb;
      const s = rel < 0.7 ? 80 : rel < 0.95 ? 64 : rel < 1.3 ? 50 : 34;
      b.scores.push(s);
      (s >= 55 ? b.drivers : b.cautions).push(
        `P/B ${pb.toFixed(1)}x vs sector ${secMed.pb.toFixed(1)}x`
      );
    } else {
      const s = pb < 2 ? 78 : pb < 4 ? 60 : pb < 8 ? 45 : 30;
      b.scores.push(s);
      (s >= 60 ? b.drivers : b.cautions).push(`P/B ${pb.toFixed(1)}x`);
    }
  }

  if (f?.targetMeanPrice != null && last > 0) {
    const upside = ((f.targetMeanPrice - last) / last) * 100;
    const s = clamp100(50 + upside * 1.8);
    b.scores.push(s);
    (upside >= 0 ? b.drivers : b.cautions).push(
      `Street target implies ${upside >= 0 ? "+" : ""}${upside.toFixed(1)}% vs price`
    );
  }
  return { key: "valuation", name: "Valuation", weight: 0.15, ...pillar(b), drivers: b.drivers, cautions: b.cautions };
}

function growthPillar(f: FundamentalsData | null): PillarScore {
  const b: PillarBuild = { scores: [], drivers: [], cautions: [] };
  if (f?.revenueGrowth != null) {
    const g = f.revenueGrowth;
    const s = g > 0.18 ? 88 : g > 0.1 ? 72 : g > 0.04 ? 56 : g > 0 ? 44 : 22;
    b.scores.push(s);
    (s >= 56 ? b.drivers : b.cautions).push(`Revenue growth ${pct(g)} YoY`);
  }
  if (f?.earningsGrowth != null) {
    const g = f.earningsGrowth;
    const s = g > 0.2 ? 88 : g > 0.1 ? 72 : g > 0 ? 54 : 24;
    b.scores.push(s);
    (s >= 54 ? b.drivers : b.cautions).push(`Earnings growth ${pct(g)} YoY`);
  }
  return { key: "growth", name: "Growth", weight: 0.15, ...pillar(b), drivers: b.drivers, cautions: b.cautions };
}

function qualityPillar(f: FundamentalsData | null): PillarScore {
  const b: PillarBuild = { scores: [], drivers: [], cautions: [] };
  if (f?.returnOnEquity != null) {
    const roe = f.returnOnEquity;
    const s = roe > 0.2 ? 90 : roe > 0.14 ? 74 : roe > 0.08 ? 55 : roe > 0 ? 38 : 18;
    b.scores.push(s);
    (s >= 55 ? b.drivers : b.cautions).push(`ROE ${pct(roe)}`);
  }
  if (f?.profitMargin != null) {
    const m = f.profitMargin;
    const s = m > 0.18 ? 86 : m > 0.1 ? 70 : m > 0.04 ? 52 : m > 0 ? 38 : 15;
    b.scores.push(s);
    (s >= 52 ? b.drivers : b.cautions).push(`Net margin ${pct(m)}`);
  }
  if (f?.operatingMargin != null) {
    const m = f.operatingMargin;
    const s = m > 0.2 ? 84 : m > 0.12 ? 66 : m > 0.05 ? 50 : 32;
    b.scores.push(s);
    (s >= 50 ? b.drivers : b.cautions).push(`Operating margin ${pct(m)}`);
  }
  return { key: "quality", name: "Quality", weight: 0.15, ...pillar(b), drivers: b.drivers, cautions: b.cautions };
}

function momentumPillar(t: TechnicalIndicators): PillarScore {
  const b: PillarBuild = { scores: [], drivers: [], cautions: [] };
  if (t.sma50 && t.sma200) {
    const above50 = t.last > t.sma50;
    const above200 = t.last > t.sma200;
    const golden = t.sma50 > t.sma200;
    const s = (above50 ? 30 : 8) + (above200 ? 25 : 8) + (golden ? 30 : 8);
    b.scores.push(clamp100(s + 7));
    (above50 && above200 ? b.drivers : b.cautions).push(
      `Price ${above50 ? "above" : "below"} 50-DMA, ${above200 ? "above" : "below"} 200-DMA (${golden ? "golden" : "death"}-cross regime)`
    );
  }
  if (t.return3M !== undefined) {
    const s = clamp100(50 + t.return3M * 2.2);
    b.scores.push(s);
    (t.return3M >= 0 ? b.drivers : b.cautions).push(
      `3-month return ${t.return3M >= 0 ? "+" : ""}${t.return3M.toFixed(1)}%`
    );
  }
  if (t.rsi14 !== undefined) {
    const r = t.rsi14;
    const s = r >= 45 && r <= 65 ? 75 : r > 65 && r <= 72 ? 60 : r > 72 ? 40 : r >= 35 ? 55 : 35;
    b.scores.push(s);
    if (r > 72) b.cautions.push(`RSI ${r.toFixed(0)} · overbought, pullback risk`);
    else if (r < 32) b.cautions.push(`RSI ${r.toFixed(0)} · heavily oversold (weak tape, possible bounce)`);
    else b.drivers.push(`RSI ${r.toFixed(0)} · healthy zone`);
  }
  if (t.pctFrom52wHigh !== undefined && t.pctFrom52wHigh > -6) {
    b.drivers.push("Trading within 6% of its 52-week high");
  }
  return { key: "momentum", name: "Momentum", weight: 0.2, ...pillar(b), drivers: b.drivers, cautions: b.cautions };
}

function strengthPillar(f: FundamentalsData | null): PillarScore {
  const b: PillarBuild = { scores: [], drivers: [], cautions: [] };
  if (f?.debtToEquity != null) {
    const de = f.debtToEquity; // Yahoo reports in %
    const s = de < 40 ? 88 : de < 90 ? 68 : de < 180 ? 46 : 24;
    b.scores.push(s);
    (s >= 60 ? b.drivers : b.cautions).push(`Debt/Equity ${(de / 100).toFixed(2)}x`);
  }
  if (f?.totalCash != null && f?.totalDebt != null && f.totalDebt > 0) {
    const ratio = f.totalCash / f.totalDebt;
    const s = ratio > 1 ? 85 : ratio > 0.5 ? 65 : ratio > 0.2 ? 48 : 32;
    b.scores.push(s);
    (ratio > 0.5 ? b.drivers : b.cautions).push(
      `Cash covers ${(ratio * 100).toFixed(0)}% of total debt`
    );
  }
  return { key: "strength", name: "Fin. Strength", weight: 0.1, ...pillar(b), drivers: b.drivers, cautions: b.cautions };
}

function sentimentPillar(
  s: SentimentResult,
  f: FundamentalsData | null,
  newsCount: number,
  ai: AiAnalysis | null
): PillarScore {
  const b: PillarBuild = { scores: [], drivers: [], cautions: [] };
  const aiUsable = ai && ai.source !== "none" && ai.models.length > 0;
  if (aiUsable) {
    // Dual-model averaged sentiment, materiality-weighted, preferred over lexicon.
    const sc = clamp100(50 + ai.sentiment * 38);
    b.scores.push(sc);
    (ai.sentiment >= 0 ? b.drivers : b.cautions).push(
      `AI read (${ai.models.length === 2 ? "2 models" : "1 model"}): ${ai.models[0].note}`
    );
  } else if (newsCount > 0) {
    const sc = clamp100(50 + s.score * 38);
    b.scores.push(sc);
    (s.score >= 0 ? b.drivers : b.cautions).push(
      `${s.positive} bullish vs ${s.negative} bearish of ${newsCount} recent headlines`
    );
  }
  if (f?.recommendationKey) {
    const map: Record<string, number> = { strong_buy: 90, buy: 74, hold: 50, underperform: 30, sell: 15 };
    const sc = map[f.recommendationKey] ?? 50;
    b.scores.push(sc);
    (sc >= 60 ? b.drivers : b.cautions).push(
      `Analyst consensus: ${f.recommendationKey.replace(/_/g, " ")}${f.numberOfAnalysts ? ` (${f.numberOfAnalysts} analysts)` : ""}`
    );
  }
  return { key: "sentiment", name: "Sentiment", weight: 0.1, ...pillar(b), drivers: b.drivers, cautions: b.cautions };
}

function riskPillar(t: TechnicalIndicators, f: FundamentalsData | null): PillarScore {
  const b: PillarBuild = { scores: [], drivers: [], cautions: [] };
  // Here drivers = risk factors (what makes it risky), cautions = mitigants.
  if (t.annualizedVolatility !== undefined) {
    const v = t.annualizedVolatility;
    const s = v < 18 ? 25 : v < 28 ? 42 : v < 42 ? 62 : 82;
    b.scores.push(s);
    (s >= 50 ? b.drivers : b.cautions).push(
      `Annualised volatility ${v.toFixed(0)}% · ${s >= 50 ? "elevated swings" : "relatively contained"}`
    );
  }
  if (t.pctFrom52wHigh !== undefined && t.pctFrom52wHigh < -25) {
    b.scores.push(70);
    b.drivers.push(`Drawdown ${Math.abs(t.pctFrom52wHigh).toFixed(0)}% below its 52-week high`);
  }
  if (f?.beta != null) {
    const s = f.beta > 1.4 ? 72 : f.beta > 1.1 ? 55 : 35;
    b.scores.push(s);
    (s >= 55 ? b.drivers : b.cautions).push(`Beta ${f.beta.toFixed(2)} vs market`);
  }
  if (f?.debtToEquity != null && f.debtToEquity > 180) {
    b.scores.push(75);
    b.drivers.push("Highly leveraged balance sheet");
  }
  if (f?.heldByInstitutions != null && f.heldByInstitutions > 0.45) {
    b.drivers.push(
      `High institutional concentration (${pct(f.heldByInstitutions)}) · crowded-exit risk`
    );
  }
  return { key: "risk", name: "Risk", weight: 0.15, ...pillar(b), drivers: b.drivers, cautions: b.cautions };
}

export async function buildAnalysis(symbol: string): Promise<AnalysisResult> {
  const chart = await getChart(symbol, "1y", "1d");
  const technicals = computeIndicators(chart.candles);
  if (!technicals) throw new Error("Insufficient price history for analysis");

  let fundamentals: FundamentalsData | null = null;
  try {
    fundamentals = await getFundamentals(symbol);
  } catch {
    // Indices/ETFs may have no fundamentals · pillars degrade gracefully.
  }

  let news: NewsItem[] = [];
  try {
    news = (await getNews(`${fundamentals?.name ?? symbol} stock`)).slice(0, 25);
  } catch {
    // News source down · sentiment pillar marks itself unavailable.
  }
  const sentiment = scoreNewsSentiment(news);
  const ai = await getAiAnalysis(symbol).catch(() => null);

  // Sector medians for relative valuation · best-effort, falls back gracefully.
  let secMed: SectorMedians | null = null;
  if (fundamentals?.sector) {
    const medians = await getSectorMedians().catch(() => null);
    secMed = medians?.[fundamentals.sector] ?? null;
  }

  const pillars: PillarScore[] = [
    valuationPillar(fundamentals, technicals.last, secMed),
    growthPillar(fundamentals),
    qualityPillar(fundamentals),
    momentumPillar(technicals),
    strengthPillar(fundamentals),
    sentimentPillar(sentiment, fundamentals, news.length, ai),
    riskPillar(technicals, fundamentals),
  ];

  // Overall: weighted mean over available pillars; risk enters inverted.
  const usable = pillars.filter((p) => p.available);
  const totalWeight = usable.reduce((a, p) => a + p.weight, 0) || 1;
  const overallScore = clamp100(
    usable.reduce((a, p) => {
      const effective = p.key === "risk" ? 100 - p.score : p.score;
      return a + effective * (p.weight / totalWeight);
    }, 0)
  );

  const stance: AnalysisResult["stance"] =
    overallScore >= 68 ? "Constructive" : overallScore >= 45 ? "Balanced" : "Cautious";

  const availableCount = usable.length;
  const confidence: AnalysisResult["confidence"] =
    availableCount >= 6 ? "high" : availableCount >= 4 ? "medium" : "low";

  // Cross-pillar rollups, ranked by pillar weight × distance from neutral.
  const rank = (p: PillarScore) => p.weight * Math.abs((p.key === "risk" ? 100 - p.score : p.score) - 50);
  const sorted = [...usable].sort((a, b) => rank(b) - rank(a));
  const drivers = sorted
    .filter((p) => (p.key === "risk" ? 100 - p.score : p.score) >= 58)
    .flatMap((p) => p.drivers.length ? [p.drivers[0]] : [])
    .slice(0, 4);
  const risks = [
    ...pillars.find((p) => p.key === "risk")!.drivers,
    ...sorted
      .filter((p) => p.key !== "risk" && p.score < 45)
      .flatMap((p) => (p.cautions.length ? [p.cautions[0]] : [])),
  ].slice(0, 4);

  const upside = fundamentals?.targetMeanPrice
    ? ((fundamentals.targetMeanPrice - technicals.last) / technicals.last) * 100
    : undefined;

  const aiNote = ai && ai.source !== "none" && ai.models.length > 0 ? ai.models[0].note : null;

  const rulesNarrative =
    `${symbol} scores ${overallScore}/100 (${stance.toLowerCase()}). ` +
    (drivers.length ? `Working in its favour: ${drivers.slice(0, 2).join("; ").toLowerCase()}. ` : "") +
    (risks.length ? `Key risks: ${risks.slice(0, 2).join("; ").toLowerCase()}. ` : "") +
    `Support near ₹${technicals.support?.toFixed(0)}, resistance near ₹${technicals.resistance?.toFixed(0)}.`;

  return {
    symbol,
    name: fundamentals?.name,
    overallScore,
    stance,
    confidence,
    pillars,
    drivers,
    risks,
    technicals,
    sentiment,
    analyst: {
      consensus: fundamentals?.recommendationKey,
      targetMeanPrice: fundamentals?.targetMeanPrice,
      upsidePercent: upside,
      numberOfAnalysts: fundamentals?.numberOfAnalysts,
    },
    narrative: aiNote ?? rulesNarrative,
    narrativeSource: aiNote ? "ai" : "rules",
    sentimentSource: ai && ai.source !== "none" ? "ai" : "lexicon",
    aiSource: ai?.source ?? "none",
    modelViews: ai?.models ?? [],
    generatedAt: Date.now(),
  };
}
