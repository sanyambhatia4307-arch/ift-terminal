import { NIFTY50 } from "@/lib/data/nifty50";

/**
 * Curated constituent lists for major NSE indices. NSE blocks its
 * constituents API for non-browser clients, so membership is maintained
 * statically here and quotes are fetched live from Yahoo. Lists cover the
 * dominant members; live index membership may differ slightly.
 */
export const INDEX_CONSTITUENTS: Record<string, string[]> = {
  "NIFTY 50": NIFTY50.map((c) => c.symbol),
  "NIFTY BANK": [
    "HDFCBANK", "ICICIBANK", "SBIN", "KOTAKBANK", "AXISBANK", "INDUSINDBK",
    "PNB", "BANKBARODA", "CANBK", "FEDERALBNK", "IDFCFIRSTB", "AUBANK",
  ],
  "NIFTY IT": [
    "TCS", "INFY", "HCLTECH", "WIPRO", "TECHM", "LTIM", "MPHASIS",
    "COFORGE", "PERSISTENT", "LTTS",
  ],
  "NIFTY AUTO": [
    "MARUTI", "M&M", "BAJAJ-AUTO", "EICHERMOT", "HEROMOTOCO", "TVSMOTOR",
    "ASHOKLEY", "BHARATFORG", "MOTHERSON", "BOSCHLTD",
  ],
  "NIFTY PHARMA": [
    "SUNPHARMA", "DRREDDY", "CIPLA", "DIVISLAB", "LUPIN", "AUROPHARMA",
    "ALKEM", "ZYDUSLIFE", "TORNTPHARM", "GLENMARK",
  ],
  "NIFTY FMCG": [
    "HINDUNILVR", "ITC", "NESTLEIND", "BRITANNIA", "TATACONSUM", "DABUR",
    "GODREJCP", "MARICO", "COLPAL", "UBL", "VBL",
  ],
  "NIFTY METAL": [
    "TATASTEEL", "JSWSTEEL", "HINDALCO", "VEDL", "JINDALSTEL", "SAIL",
    "NMDC", "NATIONALUM", "HINDZINC",
  ],
  "NIFTY ENERGY": [
    "RELIANCE", "ONGC", "NTPC", "POWERGRID", "COALINDIA", "IOC", "BPCL",
    "GAIL", "TATAPOWER", "ADANIGREEN",
  ],
  "NIFTY FIN SERVICE": [
    "HDFCBANK", "ICICIBANK", "SBIN", "KOTAKBANK", "AXISBANK", "BAJFINANCE",
    "BAJAJFINSV", "JIOFIN", "SHRIRAMFIN", "HDFCLIFE", "SBILIFE", "CHOLAFIN",
  ],
  "NIFTY REALTY": [
    "DLF", "LODHA", "GODREJPROP", "OBEROIRLTY", "PRESTIGE", "PHOENIXLTD",
    "BRIGADE", "SOBHA",
  ],
  "NIFTY PSU BANK": [
    "SBIN", "PNB", "BANKBARODA", "CANBK", "UNIONBANK", "INDIANB",
    "BANKINDIA", "MAHABANK", "IOB", "UCOBANK",
  ],
  "NIFTY MEDIA": [
    "ZEEL", "SUNTV", "PVRINOX", "NETWORK18", "NAZARA", "SAREGAMA", "DISHTV",
  ],
  "NIFTY PVT BANK": [
    "HDFCBANK", "ICICIBANK", "KOTAKBANK", "AXISBANK", "INDUSINDBK",
    "FEDERALBNK", "IDFCFIRSTB", "RBLBANK", "BANDHANBNK", "CUB",
  ],
  "NIFTY NEXT 50": [
    "LICI", "HAL", "DLF", "VEDL", "ZYDUSLIFE", "GAIL", "IOC", "BPCL",
    "TATAPOWER", "GODREJCP", "DABUR", "AMBUJACEM", "SIEMENS", "ABB",
    "HAVELLS", "CHOLAFIN", "VBL", "PIDILITIND", "INDIGO", "DMART",
    "NAUKRI", "ADANIGREEN", "ADANIPOWER", "ICICIGI", "ICICIPRULI",
    "IRFC", "PFC", "RECLTD", "LODHA", "MOTHERSON",
  ],
};

export function constituentsFor(index: string): string[] | null {
  return INDEX_CONSTITUENTS[index.toUpperCase()] ?? null;
}
