"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV, isActive } from "@/components/shell/nav-items";
import { TONE } from "@/lib/tones";
import { cn } from "@/lib/utils";

/** Hamburger + slide-in navigation drawer · shown only below the md breakpoint. */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        className="flex h-8 w-8 items-center justify-center rounded-sm border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      {/* Drawer */}
      <aside
        className={cn(
          "surface-panel fixed inset-y-0 left-0 z-50 flex w-64 max-w-[80vw] flex-col border-r border-border transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-3">
          <span className="text-sm font-semibold tracking-wide">
            <span className="text-gradient">IFT</span>
            <span className="font-normal text-muted-foreground"> · Terminal</span>
          </span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close navigation menu"
            className="flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          {NAV.map(({ href, label, icon: Icon, tone }) => {
            const active = isActive(pathname, href);
            const color = TONE[tone];
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "relative flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-y-1.5 left-0 w-[3px] rounded-full"
                    style={{ backgroundColor: color }}
                  />
                )}
                <Icon className="h-4 w-4 shrink-0" style={{ color: active ? color : undefined }} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3 text-[10px] leading-relaxed text-muted-foreground">
          Data: NSE · BSE · Yahoo · RSS. Free sources; quotes delayed up to 15 min.
        </div>
      </aside>
    </div>
  );
}
