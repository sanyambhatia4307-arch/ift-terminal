import { handle } from "@/lib/api-route";
import { cached } from "@/lib/cache";
import { yahooQuotes } from "@/lib/sources/yahoo";
import type { StockQuote } from "@/types/market";

export const dynamic = "force-dynamic";

const GROUPS: Array<{
  group: string;
  items: Array<{ symbol: string; label: string; unit: string; appSymbol?: string }>;
}> = [
  {
    group: "Precious Metals (Global)",
    items: [
      { symbol: "GC=F", label: "Gold (COMEX)", unit: "USD/oz" },
      { symbol: "SI=F", label: "Silver (COMEX)", unit: "USD/oz" },
      { symbol: "PL=F", label: "Platinum (NYMEX)", unit: "USD/oz" },
    ],
  },
  {
    group: "Energy",
    items: [
      { symbol: "BZ=F", label: "Brent Crude", unit: "USD/bbl" },
      { symbol: "CL=F", label: "WTI Crude", unit: "USD/bbl" },
      { symbol: "NG=F", label: "Natural Gas (HH)", unit: "USD/MMBtu" },
    ],
  },
  {
    group: "Base Metals",
    items: [{ symbol: "HG=F", label: "Copper (COMEX)", unit: "USD/lb" }],
  },
  {
    group: "India ETFs (₹ · trade like stocks)",
    items: [
      { symbol: "GOLDBEES.NS", label: "Nippon Gold BeES", unit: "₹/unit", appSymbol: "GOLDBEES" },
      { symbol: "SETFGOLD.NS", label: "SBI Gold ETF", unit: "₹/unit", appSymbol: "SETFGOLD" },
      { symbol: "SILVERBEES.NS", label: "Nippon Silver BeES", unit: "₹/unit", appSymbol: "SILVERBEES" },
    ],
  },
  {
    group: "Context",
    items: [{ symbol: "INR=X", label: "USD/INR", unit: "₹" }],
  },
];

export interface CommodityRow extends StockQuote {
  label: string;
  unit: string;
  appSymbol?: string;
}

export function GET() {
  return handle(() =>
    cached("commodities:v2", 60_000, async () => {
      const symbols = GROUPS.flatMap((g) => g.items.map((i) => i.symbol));
      const quotes = await yahooQuotes(symbols);
      return GROUPS.map((g) => ({
        group: g.group,
        rows: g.items
          .map((item) => {
            const q = quotes.find((x) => x.symbol === item.symbol);
            return q
              ? ({ ...q, label: item.label, unit: item.unit, appSymbol: item.appSymbol } as CommodityRow)
              : null;
          })
          .filter((r): r is CommodityRow => r !== null),
      }));
    })
  );
}
