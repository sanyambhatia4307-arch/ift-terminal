import { NavList } from "@/components/shell/NavList";

export function Sidebar() {
  return (
    <aside className="hidden w-48 shrink-0 flex-col overflow-y-auto border-r border-border bg-background/60 md:flex">
      <div className="p-2.5 pt-4">
        <NavList />
      </div>
      <div className="mt-auto p-3.5 text-[10.5px] leading-relaxed text-muted-foreground/70">
        NSE · Yahoo Finance · RSS. Free sources, quotes may be delayed up to 15 min.
      </div>
    </aside>
  );
}
