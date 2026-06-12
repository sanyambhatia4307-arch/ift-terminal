"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Holding {
  id: string;
  symbol: string;
  qty: number;
  avgPrice: number;
}

interface PortfolioState {
  holdings: Holding[];
  add: (h: Omit<Holding, "id">) => void;
  remove: (id: string) => void;
}

export const usePortfolio = create<PortfolioState>()(
  persist(
    (set) => ({
      holdings: [],
      add: (h) =>
        set((s) => {
          // Same symbol again → merge into a weighted-average position.
          const existing = s.holdings.find((x) => x.symbol === h.symbol);
          if (existing) {
            const totalQty = existing.qty + h.qty;
            const avgPrice =
              (existing.qty * existing.avgPrice + h.qty * h.avgPrice) / totalQty;
            return {
              holdings: s.holdings.map((x) =>
                x.symbol === h.symbol ? { ...x, qty: totalQty, avgPrice } : x
              ),
            };
          }
          return {
            holdings: [
              ...s.holdings,
              { ...h, id: `${h.symbol}-${Date.now().toString(36)}` },
            ],
          };
        }),
      remove: (id) => set((s) => ({ holdings: s.holdings.filter((x) => x.id !== id) })),
    }),
    { name: "ift-portfolio" }
  )
);
