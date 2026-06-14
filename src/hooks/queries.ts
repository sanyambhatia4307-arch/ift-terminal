"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { AnalysisResult } from "@/lib/analysis/engine";
import type { IndicesPayload } from "@/lib/market";
import type { RotationPayload } from "@/lib/analysis/rotation";
import type { ScreenerPayload } from "@/lib/screener";
import type {
  ChartResult,
  EstimatesData,
  FinancialsData,
  FundamentalsData,
  MarketStatusInfo,
  MoversResult,
  NewsItem,
  OptionChainData,
  SearchResult,
  ShareholdingData,
  StockQuote,
} from "@/types/market";

interface Envelope<T> {
  ok: boolean;
  data: T;
  error?: string;
}

async function get<T>(url: string): Promise<T> {
  const res = await axios.get<Envelope<T>>(url);
  if (!res.data.ok) throw new Error(res.data.error ?? "Request failed");
  return res.data.data;
}

export function useIndices() {
  return useQuery({
    queryKey: ["indices"],
    queryFn: () => get<IndicesPayload>("/api/indices"),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useMarketStatus() {
  return useQuery({
    queryKey: ["market-status"],
    queryFn: () => get<MarketStatusInfo>("/api/market-status"),
    refetchInterval: 60_000,
  });
}

export function useMovers() {
  return useQuery({
    queryKey: ["movers"],
    queryFn: () => get<MoversResult>("/api/movers"),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useQuote(symbol: string | undefined) {
  return useQuery({
    queryKey: ["quote", symbol],
    queryFn: () => get<StockQuote>(`/api/quote/${encodeURIComponent(symbol!)}`),
    enabled: !!symbol,
    refetchInterval: 30_000,
  });
}

export function useQuotes(symbols: string[]) {
  return useQuery({
    queryKey: ["quotes", ...symbols],
    queryFn: () =>
      get<StockQuote[]>(`/api/quotes?symbols=${encodeURIComponent(symbols.join(","))}`),
    enabled: symbols.length > 0,
    refetchInterval: 45_000,
  });
}

export function useChart(symbol: string | undefined, range: string, interval: string) {
  return useQuery({
    queryKey: ["chart", symbol, range, interval],
    queryFn: () =>
      get<ChartResult>(
        `/api/chart/${encodeURIComponent(symbol!)}?range=${range}&interval=${interval}`
      ),
    enabled: !!symbol,
    refetchInterval: range === "1d" ? 60_000 : false,
    staleTime: 30_000,
  });
}

export function useFundamentals(symbol: string | undefined) {
  return useQuery({
    queryKey: ["fundamentals", symbol],
    queryFn: () =>
      get<FundamentalsData>(`/api/fundamentals/${encodeURIComponent(symbol!)}`),
    enabled: !!symbol,
    staleTime: 60 * 60 * 1000,
  });
}

export function useFinancials(symbol: string | undefined) {
  return useQuery({
    queryKey: ["financials", symbol],
    queryFn: () => get<FinancialsData>(`/api/financials/${encodeURIComponent(symbol!)}`),
    enabled: !!symbol,
    staleTime: 12 * 60 * 60 * 1000,
  });
}

export function useOptionChain(symbol: string | undefined) {
  return useQuery({
    queryKey: ["options", symbol],
    queryFn: () => get<OptionChainData>(`/api/options/${encodeURIComponent(symbol!)}`),
    enabled: !!symbol,
    refetchInterval: 90_000,
    staleTime: 60_000,
    retry: 0,
  });
}

export function useShareholding(symbol: string | undefined) {
  return useQuery({
    queryKey: ["shareholding", symbol],
    queryFn: () => get<ShareholdingData>(`/api/shareholding/${encodeURIComponent(symbol!)}`),
    enabled: !!symbol,
    staleTime: 6 * 60 * 60 * 1000,
    retry: 0,
  });
}

export function useEstimates(symbol: string | undefined) {
  return useQuery({
    queryKey: ["estimates", symbol],
    queryFn: () => get<EstimatesData>(`/api/estimates/${encodeURIComponent(symbol!)}`),
    enabled: !!symbol,
    staleTime: 6 * 60 * 60 * 1000,
  });
}

export function useNews(query?: string) {
  return useQuery({
    queryKey: ["news", query ?? "_market"],
    queryFn: () =>
      get<NewsItem[]>(`/api/news${query ? `?q=${encodeURIComponent(query)}` : ""}`),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });
}

export function useScreener() {
  return useQuery({
    queryKey: ["screener"],
    queryFn: () => get<ScreenerPayload>("/api/screener"),
    staleTime: 15 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
  });
}

export function useRotation() {
  return useQuery({
    queryKey: ["rotation"],
    queryFn: () => get<RotationPayload>("/api/rotation"),
    staleTime: 10 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  });
}

export function useBetas(symbols: string[]) {
  return useQuery({
    queryKey: ["betas", [...symbols].sort().join(",")],
    queryFn: () => get<Record<string, number>>(`/api/betas?symbols=${encodeURIComponent(symbols.join(","))}`),
    enabled: symbols.length > 0,
    staleTime: 6 * 60 * 60 * 1000,
  });
}

export function useAnalysis(symbol: string | undefined) {
  return useQuery({
    queryKey: ["analysis", symbol],
    queryFn: () =>
      get<AnalysisResult>(`/api/analysis/${encodeURIComponent(symbol!)}`),
    enabled: !!symbol,
    staleTime: 10 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}

export function useSymbolSearch(q: string) {
  return useQuery({
    queryKey: ["search", q],
    queryFn: () => get<SearchResult[]>(`/api/search?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length >= 2,
    staleTime: 10 * 60 * 1000,
  });
}
