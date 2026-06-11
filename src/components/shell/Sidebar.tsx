"use client";

import {
  Globe2,
  LayoutDashboard,
  ListChecks,
  Newspaper,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/markets", label: "Markets", icon: Globe2 },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/watchlist", label: "Watchlist", icon: ListChecks },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex w-44 shrink-0 flex-col border-r border-border bg-card/40">
      <nav className="flex flex-col gap-px p-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-[13px] transition-colors",
                active
                  ? "bg-accent text-primary"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-border p-3 text-[10px] leading-relaxed text-muted-foreground">
        Data: NSE · BSE · Yahoo Finance · RSS. Free sources; quotes may be
        delayed up to 15 min.
      </div>
    </aside>
  );
}
