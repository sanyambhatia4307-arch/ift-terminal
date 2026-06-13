import { handle } from "@/lib/api-route";
import { cached } from "@/lib/cache";
import { yahooQuotes } from "@/lib/sources/yahoo";
import type { StockQuote } from "@/types/market";

export const dynamic = "force-dynamic";

const OZ_TO_G = 31.1035; // troy ounce → grams
const LB_TO_KG = 0.453592;

interface CommodityItem {
  symbol: string;
  label: string;
  unit: string; // native quote unit
  appSymbol?: string; // research-view symbol (ETFs)
  inrUnit: string; // Indian-convention display unit
  // Native price + live USD/INR → rupee value in inrUnit.
  toInr?: (native: number, usdinr: number) => number;
}

const GROUPS: Array<{ group: string; items: CommodityItem[] }> = [
  {
    group: "Precious Metals (Global)",
    items: [
      {
        symbol: "GC=F",
        label: "Gold (COMEX)",
        unit: "USD/oz",
        inrUnit: "₹/10g",
        toInr: (u, fx) => (u * fx * 10) / OZ_TO_G,
      },
      {
        symbol: "SI=F",
        label: "Silver (COMEX)",
        unit: "USD/oz",
        inrUnit: "₹/kg",
        toInr: (u, fx) => (u * fx * 1000) / OZ_TO_G,
      },
      {
        symbol: "PL=F",
        label: "Platinum (NYMEX)",
        unit: "USD/oz",
        inrUnit: "₹/10g",
        toInr: (u, fx) => (u * fx * 10) / OZ_TO_G,
      },
    ],
  },
  {
    group: "Energy",
    items: [
      {
        symbol: "BZ=F",
        label: "Brent Crude",
        unit: "USD/bbl",
        inrUnit: "₹/bbl",
        toInr: (u, fx) => u * fx,
      },
      {
        symbol: "CL=F",
        label: "WTI Crude",
        unit: "USD/bbl",
        inrUnit: "₹/bbl",
        toInr: (u, fx) => u * fx,
      },
      {
        symbol: "NG=F",
        label: "Natural Gas (HH)",
        unit: "USD/MMBtu",
        inrUnit: "₹/MMBtu",
        toInr: (u, fx) => u * fx,
      },
    ],
  },
  {
    group: "Base Metals",
    items: [
      {
        symbol: "HG=F",
        label: "Copper (COMEX)",
        unit: "USD/lb",
        inrUnit: "₹/kg",
        toInr: (u, fx) => (u * fx) / LB_TO_KG,
      },
    ],
  },
  {
    group: "India ETFs (₹ · trade like stocks)",
    items: [
      { symbol: "GOLDBEES.NS", label: "Nippon Gold BeES", unit: "₹/unit", inrUnit: "₹/unit", appSymbol: "GOLDBEES" },
      { symbol: "SETFGOLD.NS", label: "SBI Gold ETF", unit: "₹/unit", inrUnit: "₹/unit", appSymbol: "SETFGOLD" },
      { symbol: "SILVERBEES.NS", label: "Nippon Silver BeES", unit: "₹/unit", inrUnit: "₹/unit", appSymbol: "SILVERBEES" },
    ],
  },
  {
    group: "Currency",
    items: [{ symbol: "INR=X", label: "USD / INR", unit: "₹", inrUnit: "₹ per $1", appSymbol: "INR=X" }],
  },
];

export interface CommodityRow extends StockQuote {
  label: string;
  unit: string;
  appSymbol?: string;
  inrValue?: number;
  inrUnit: string;
}

export function GET() {
  return handle(() =>
    cached("commodities:v3", 60_000, async () => {
      const symbols = GROUPS.flatMap((g) => g.items.map((i) => i.symbol));
      const quotes = await yahooQuotes(symbols);
      const usdinr = quotes.find((q) => q.symbol === "INR=X")?.last ?? 0;

      return GROUPS.map((g) => ({
        group: g.group,
        rows: g.items
          .map((item) => {
            const q = quotes.find((x) => x.symbol === item.symbol);
            if (!q) return null;
            const inrValue = item.toInr
              ? usdinr
                ? item.toInr(q.last, usdinr)
                : undefined
              : q.last; // ETFs / FX already in ₹
            return {
              ...q,
              label: item.label,
              unit: item.unit,
              appSymbol: item.appSymbol,
              inrUnit: item.inrUnit,
              inrValue,
            } as CommodityRow;
          })
          .filter((r): r is CommodityRow => r !== null),
      }));
    })
  );
}
