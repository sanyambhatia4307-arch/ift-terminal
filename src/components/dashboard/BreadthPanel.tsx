"use client";

import { Panel } from "@/components/ui/panel";
import { useMovers } from "@/hooks/queries";

export function BreadthPanel() {
  const { data } = useMovers();
  const adv = data?.advances ?? 0;
  const dec = data?.declines ?? 0;
  const unch = data?.unchanged ?? 0;
  const total = adv + dec + unch || 1;

  return (
    <Panel title={`Market Breadth · ${data?.index ?? "NIFTY 50"}`}>
      <div className="space-y-2 p-2.5">
        <div className="flex h-2 overflow-hidden rounded-full bg-muted">
          <div className="bg-bull" style={{ width: `${(adv / total) * 100}%` }} />
          <div className="bg-flat/40" style={{ width: `${(unch / total) * 100}%` }} />
          <div className="bg-bear" style={{ width: `${(dec / total) * 100}%` }} />
        </div>
        <div className="flex justify-between text-xs">
          <span className="num text-bull">{adv} advancing</span>
          <span className="num text-muted-foreground">{unch} unchanged</span>
          <span className="num text-bear">{dec} declining</span>
        </div>
        <div className="text-[11px] text-muted-foreground">
          {adv > dec
            ? `Breadth is positive — ${((adv / total) * 100).toFixed(0)}% of constituents are advancing.`
            : adv < dec
              ? `Breadth is negative — ${((dec / total) * 100).toFixed(0)}% of constituents are declining.`
              : "Breadth is balanced between advancers and decliners."}
        </div>
      </div>
    </Panel>
  );
}
