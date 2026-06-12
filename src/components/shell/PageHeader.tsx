import type { LucideIcon } from "lucide-react";

/** Consistent page-level header strip used at the top of every view. */
export function PageHeader({
  icon: Icon,
  code,
  title,
  subtitle,
  right,
}: {
  icon: LucideIcon;
  code: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex h-9 items-center gap-2.5 rounded-sm border border-border bg-card px-3">
      <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
      <span className="num rounded-[2px] bg-primary/15 px-1.5 py-px text-[10px] font-semibold tracking-widest text-primary">
        {code}
      </span>
      <h1 className="text-[13px] font-semibold tracking-wide">{title}</h1>
      {subtitle && (
        <span className="hidden truncate text-[11px] text-muted-foreground md:inline">
          {subtitle}
        </span>
      )}
      {right && <div className="ml-auto flex shrink-0 items-center gap-3">{right}</div>}
    </div>
  );
}
