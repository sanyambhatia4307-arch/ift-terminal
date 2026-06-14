"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, isActive } from "@/components/shell/nav-items";
import { TONE } from "@/lib/tones";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-44 shrink-0 flex-col border-r border-border bg-card/40 md:flex">
      <nav className="flex flex-col gap-px p-2">
        {NAV.map(({ href, label, icon: Icon, tone }) => {
          const active = isActive(pathname, href);
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
