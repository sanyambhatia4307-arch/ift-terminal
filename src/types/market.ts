export interface IndexQuote {
  symbol: string;
  name: string;
  last: number;
  change: number;
  changePercent: number;
  open?: number;
  high?: number;
  low?: number;
  previousClose?: number;
  yearHigh?: number;
  yearLow?: number;
  pe?: number;
  pb?: number;
  divYield?: number;
  advances?: number;
  declines?: number;
  unchanged?: number;
  category?: string;
}

export interface StockQuote {
  symbol: string;
  name: string;
  exchange?: string;
  currency?: string;
  last: number;
  change: number;
  changePercent: number;
  open?: number;
  high?: number;
  low?: number;
  previousClose?: number;
  volume?: number;
  marketCap?: number;
  yearHigh?: number;
  yearLow?: number;
  asOf?: number; // epoch seconds of last trade
}

export interface Candle {
  time: number; // epoch seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface ChartResult {
  symbol: string;
  currency?: string;
  range: string;
  interval: string;
  previousClose?: number;
  candles: Candle[];
}

export interface Mover {
  symbol: string;
  name?: string;
  last: number;
  change: number;
  changePercent: number;
  volume?: number;
}

export interface MoversResult {
  index: string;
  source: "nse" | "yahoo";
  gainers: Mover[];
  losers: Mover[];
  advances?: number;
  declines?: number;
  unchanged?: number;
}

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  source: string;
  publishedAt: string; // ISO
}

export interface MarketStatusInfo {
  market: string;
  status: string;
  message: string;
  tradeDate?: string;
  isOpen: boolean;
  indexLast?: number;
  indexChangePercent?: number;
}

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

export interface FinancialYear {
  fy: string; // e.g. "FY26"
  date: string;
  revenue?: number;
  ebit?: number;
  netIncome?: number;
  grossProfit?: number;
  totalAssets?: number;
  currentLiabilities?: number;
  equity?: number;
  totalDebt?: number;
  operatingCashFlow?: number;
  capex?: number;
  fcf?: number;
  // derived
  roce?: number; // %
  netMargin?: number; // %
  ebitMargin?: number; // %
  cashConversion?: number; // FCF / net income, %
}

export interface OptionStrikeRow {
  strike: number;
  ceOI?: number;
  ceChg?: number;
  peOI?: number;
  peChg?: number;
  ceIV?: number;
  peIV?: number;
}

export interface OptionChainData {
  symbol: string;
  underlying?: number;
  expiry?: string;
  pcr?: number; // put OI / call OI
  maxPain?: number;
  support?: number; // strike with the most put OI (downside wall)
  resistance?: number; // strike with the most call OI (upside wall)
  totalCallOI?: number;
  totalPutOI?: number;
  rows: OptionStrikeRow[]; // strikes around the money
}

export interface ShareholdingQuarter {
  date: string;
  promoter?: number;
  publicHolding?: number;
}

export interface ShareholdingData {
  symbol: string;
  quarters: ShareholdingQuarter[];
  promoterLatest?: number;
  promoterChange?: number; // latest − earliest over the window (percentage points)
  trend: "rising" | "falling" | "stable";
}

export interface EstimatePeriod {
  label: string;
  eps?: number;
  growth?: number; // expected EPS growth (fraction)
  analysts?: number;
  up30?: number; // estimates revised up in last 30 days
  down30?: number;
}

export interface EstimatesData {
  symbol: string;
  current?: EstimatePeriod;
  next?: EstimatePeriod;
  netRevision30?: number; // up30 − down30 for the current year
  revisionTrend?: "up" | "down" | "flat";
}

export interface FinancialsData {
  symbol: string;
  years: FinancialYear[]; // chronological (oldest first)
  revenueCagr?: number; // % over the available window
  earningsCagr?: number; // %
  latestRoce?: number;
  latestFcf?: number;
  latestCashConversion?: number;
}

export interface FundamentalsData {
  symbol: string;
  name?: string;
  sector?: string;
  industry?: string;
  summary?: string;
  website?: string;
  marketCap?: number;
  trailingPE?: number;
  forwardPE?: number;
  priceToBook?: number;
  eps?: number;
  beta?: number;
  dividendYield?: number;
  bookValue?: number;
  totalRevenue?: number;
  netIncome?: number;
  profitMargin?: number;
  operatingMargin?: number;
  returnOnEquity?: number;
  debtToEquity?: number;
  revenueGrowth?: number;
  earningsGrowth?: number;
  totalCash?: number;
  totalDebt?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  fiftyDayAverage?: number;
  twoHundredDayAverage?: number;
  sharesOutstanding?: number;
  heldByInsiders?: number;
  heldByInstitutions?: number;
  targetMeanPrice?: number;
  recommendationKey?: string;
  numberOfAnalysts?: number;
  quarterlyResults?: Array<{ period: string; revenue?: number; earnings?: number }>;
  yearlyResults?: Array<{ period: string; revenue?: number; earnings?: number }>;
}
