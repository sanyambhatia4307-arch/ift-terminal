import type { LucideIcon } from "lucide-react";

/**
 * Editorial page masthead: a quiet mono eyebrow (icon + function code), a
 * serif title with real presence, and a one-line standfirst. No box.
 */
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
    <header className="panel-rise flex flex-wrap items-end gap-x-6 gap-y-2 px-1 pb-2 pt-3">
      <div className="min-w-0">
        <div className="num flex items-center gap-1.5 text-[10px] tracking-[0.18em] text-muted-foreground/70">
          <Icon className="h-3 w-3 text-primary" />
          {code}
        </div>
        <h1 className="font-display mt-1.5 text-[32px] leading-[0.95] text-foreground sm:text-[38px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-[13px] leading-snug text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {right && <div className="ml-auto flex shrink-0 items-center gap-3 pb-1">{right}</div>}
    </header>
  );
}
