"use client";

import { Activity, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CommandSearch } from "@/components/shell/CommandSearch";
import { MobileNav } from "@/components/shell/MobileNav";
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
    <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border bg-card/60 px-2 sm:gap-4 sm:px-3">
      <MobileNav />

      <Link href="/" className="flex items-center gap-2">
        <Activity className="h-4 w-4 shrink-0 text-primary" />
        <span className="text-sm font-semibold tracking-wide">
          <span className="text-gradient">IFT</span>
          <span className="hidden font-normal text-muted-foreground lg:inline">
            {" "}
            · Indian Financial Terminal
          </span>
        </span>
      </Link>

      {/* Full search on desktop; icon-only on mobile */}
      <button
        onClick={() => setSearchOpen(true)}
        aria-label="Search stocks and indices"
        className="hidden h-7 w-72 items-center gap-2 rounded-sm border border-border bg-background px-2.5 text-xs text-muted-foreground transition-colors hover:border-ring/50 sm:flex"
      >
        <Search className="h-3 w-3" />
        Search stocks, indices…
        <kbd className="num ml-auto rounded-sm border border-border px-1 text-[10px]">⌘K</kbd>
      </button>
      <button
        onClick={() => setSearchOpen(true)}
        aria-label="Search"
        className="flex h-8 w-8 items-center justify-center rounded-sm border border-border text-muted-foreground hover:bg-accent hover:text-foreground sm:hidden"
      >
        <Search className="h-4 w-4" />
      </button>

      <div className="ml-auto flex items-center gap-3 sm:gap-4">
        {status && (
          <span className="flex items-center gap-1.5 text-xs">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                status.isOpen ? "bg-bull animate-pulse" : "bg-bear"
              )}
            />
            <span className={status.isOpen ? "text-bull" : "text-muted-foreground"}>
              {status.isOpen ? "OPEN" : "CLOSED"}
            </span>
          </span>
        )}
        <span className="hidden sm:inline">
          <IstClock />
        </span>
      </div>

      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
