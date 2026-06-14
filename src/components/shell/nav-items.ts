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
import type { ToneName } from "@/lib/tones";

export interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  tone: ToneName;
}

/** Single source of truth for the primary navigation (sidebar + mobile drawer). */
export const NAV: NavItem[] = [
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

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
