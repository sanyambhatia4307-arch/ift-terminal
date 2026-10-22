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

export interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

/** Single source of truth for navigation, grouped the way an analyst works. */
export const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/markets", label: "Markets", icon: Globe2 },
      { href: "/rotation", label: "Rotation", icon: Radar },
    ],
  },
  {
    label: "Research",
    items: [
      { href: "/screener", label: "Screener", icon: Telescope },
      { href: "/compare", label: "Compare", icon: GitCompareArrows },
      { href: "/earnings", label: "Earnings", icon: CalendarClock },
      { href: "/ipos", label: "IPOs", icon: Rocket },
      { href: "/news", label: "News", icon: Newspaper },
    ],
  },
  {
    label: "Trading",
    items: [
      { href: "/intraday", label: "Intraday", icon: Crosshair },
      { href: "/commodities", label: "Commodities", icon: Coins },
    ],
  },
  {
    label: "Yours",
    items: [
      { href: "/portfolio", label: "Portfolio", icon: Briefcase },
      { href: "/watchlist", label: "Watchlist", icon: ListChecks },
    ],
  },
];

export const GUIDE_ITEM: NavItem = { href: "/guide", label: "Guide", icon: BookOpen };

export const NAV: NavItem[] = [...NAV_GROUPS.flatMap((g) => g.items), GUIDE_ITEM];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
