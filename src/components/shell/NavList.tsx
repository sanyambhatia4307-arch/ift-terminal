"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GUIDE_ITEM, NAV_GROUPS, isActive, type NavItem } from "@/components/shell/nav-items";
import { cn } from "@/lib/utils";

function NavLink({ item, onNavigate, size }: { item: NavItem; onNavigate?: () => void; size: "sm" | "lg" }) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center rounded-md transition-colors duration-150",
        size === "lg" ? "gap-3 px-3 py-2.5 text-sm" : "gap-2.5 px-2.5 py-[7px] text-[13px]",
        active
          ? "bg-accent/70 text-foreground"
          : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
      )}
    >
      {active && <span aria-hidden className="absolute inset-y-1.5 left-0 w-[2px] rounded-full bg-primary" />}
      <Icon className={cn("shrink-0", size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5", active && "text-primary")} />
      {item.label}
    </Link>
  );
}

/** Grouped navigation shared by the desktop sidebar and the mobile drawer. */
export function NavList({ onNavigate, size = "sm" }: { onNavigate?: () => void; size?: "sm" | "lg" }) {
  return (
    <nav className="flex flex-col gap-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-px">
          <div className="px-2.5 pb-1 text-[10.5px] font-medium text-muted-foreground/55">{group.label}</div>
          {group.items.map((item) => (
            <NavLink key={item.href} item={item} onNavigate={onNavigate} size={size} />
          ))}
        </div>
      ))}
      <div className="border-t border-border/60 pt-3">
        <NavLink item={GUIDE_ITEM} onNavigate={onNavigate} size={size} />
      </div>
    </nav>
  );
}
