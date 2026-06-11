"use client";

import { NewsPanel } from "@/components/dashboard/NewsPanel";
import { useFundamentals } from "@/hooks/queries";

export function StockNews({ symbol }: { symbol: string }) {
  const { data: f } = useFundamentals(symbol);
  // Company name gives much better news recall than the ticker alone.
  const query = `${f?.name ?? symbol} stock`;
  return <NewsPanel query={query} count={8} title={`News · ${symbol}`} />;
}
