"use client";

import {
  BookOpen,
  Briefcase,
  CalendarClock,
  Coins,
  Crosshair,
  GitCompareArrows,
  Globe2,
  LayoutDashboard,
  ListChecks,
  Newspaper,
  Radar,
  Rocket,
  Telescope,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TONE, type ToneName } from "@/lib/tones";
import { cn } from "@/lib/utils";

const NAV: Array<{
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  tone: ToneName;
}> = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, tone: "amber" },
  { href: "/markets", label: "Markets", icon: Globe2, tone: "blue" },
  { href: "/screener", label: "Screener", icon: Telescope, tone: "violet" },
  { href: "/rotation", label: "Rotation", icon: Radar, tone: "cyan" },
  { href: "/intraday", label: "Intraday", icon: Crosshair, tone: "green" },
  { href: "/earnings", label: "Earnings", icon: CalendarClock, tone: "violet" },
  { href: "/compare", label: "Compare", icon: GitCompareArrows, tone: "cyan" },
  { href: "/ipos", label: "IPOs", icon: Rocket, tone: "pink" },
  { href: "/commodities", label: "Commodities", icon: Coins, tone: "orange" },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase, tone: "teal" },
  { href: "/watchlist", label: "Watchlist", icon: ListChecks, tone: "teal" },
  { href: "/news", label: "News", icon: Newspaper, tone: "blue" },
  { href: "/guide", label: "Guide", icon: BookOpen, tone: "blue" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex w-44 shrink-0 flex-col border-r border-border bg-card/40">
      <nav className="flex flex-col gap-px p-2">
        {NAV.map(({ href, label, icon: Icon, tone }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          const color = TONE[tone];
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-[13px] transition-colors duration-150",
                active
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-y-1 left-0 w-[3px] rounded-full"
                  style={{ backgroundColor: color }}
                />
              )}
              <Icon
                className="h-3.5 w-3.5 transition-colors"
                style={{ color: active ? color : undefined }}
              />
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
