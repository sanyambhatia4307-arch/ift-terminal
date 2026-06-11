"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WatchlistState {
  symbols: string[];
  add: (symbol: string) => void;
  remove: (symbol: string) => void;
  has: (symbol: string) => boolean;
}

const DEFAULT_WATCHLIST = ["RELIANCE", "HDFCBANK", "TCS", "INFY", "ICICIBANK", "TATAMOTORS"];

export const useWatchlist = create<WatchlistState>()(
  persist(
    (set, get) => ({
      symbols: DEFAULT_WATCHLIST,
      add: (symbol) =>
        set((s) =>
          s.symbols.includes(symbol) ? s : { symbols: [...s.symbols, symbol] }
        ),
      remove: (symbol) =>
        set((s) => ({ symbols: s.symbols.filter((x) => x !== symbol) })),
      has: (symbol) => get().symbols.includes(symbol),
    }),
    { name: "ift-watchlist" }
  )
);
