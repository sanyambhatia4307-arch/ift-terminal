"use client";

import { Activity, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CommandSearch } from "@/components/shell/CommandSearch";
import { useMarketStatus } from "@/hooks/queries";
import { cn } from "@/lib/utils";

function IstClock() {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour12: false,
        })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="num text-xs text-muted-foreground">{now} IST</span>;
}

export function TopBar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: status } = useMarketStatus();

  return (
    <header className="flex h-11 shrink-0 items-center gap-4 border-b border-border bg-card/60 px-3">
      <Link href="/" className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold tracking-wide">
          <span className="text-gradient">IFT</span>
          <span className="text-muted-foreground font-normal"> · Indian Financial Terminal</span>
        </span>
      </Link>

      <button
        onClick={() => setSearchOpen(true)}
        className="flex h-7 w-72 items-center gap-2 rounded-sm border border-border bg-background px-2.5 text-xs text-muted-foreground transition-colors hover:border-ring/50"
      >
        <Search className="h-3 w-3" />
        Search stocks, indices…
        <kbd className="num ml-auto rounded-sm border border-border px-1 text-[10px]">⌘K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-4">
        {status && (
          <span className="flex items-center gap-1.5 text-xs">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                status.isOpen ? "bg-bull animate-pulse" : "bg-bear"
              )}
            />
            <span className={status.isOpen ? "text-bull" : "text-muted-foreground"}>
              NSE {status.isOpen ? "OPEN" : "CLOSED"}
            </span>
          </span>
        )}
        <IstClock />
      </div>

      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
