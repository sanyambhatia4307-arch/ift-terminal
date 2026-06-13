"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PriceAlert {
  id: string;
  symbol: string;
  direction: "above" | "below";
  price: number;
}

interface AlertState {
  alerts: PriceAlert[];
  add: (a: Omit<PriceAlert, "id">) => void;
  remove: (id: string) => void;
}

export const useAlerts = create<AlertState>()(
  persist(
    (set) => ({
      alerts: [],
      add: (a) =>
        set((s) => ({
          alerts: [
            ...s.alerts,
            { ...a, symbol: a.symbol.toUpperCase(), id: `${a.symbol}-${Date.now().toString(36)}` },
          ],
        })),
      remove: (id) => set((s) => ({ alerts: s.alerts.filter((x) => x.id !== id) })),
    }),
    { name: "ift-alerts" }
  )
);
