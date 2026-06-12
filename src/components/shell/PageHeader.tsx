import type { LucideIcon } from "lucide-react";
import { toneFor } from "@/lib/tones";

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
  const tone = toneFor(code);
  return (
    <div className="panel-rise relative flex h-9 items-center gap-2.5 overflow-hidden rounded-sm border border-border bg-card px-3">
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{
          background: `linear-gradient(180deg, ${tone}, color-mix(in oklab, ${tone} 30%, transparent))`,
        }}
      />
      <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: tone }} />
      <span
        className="num rounded-[2px] px-1.5 py-px text-[10px] font-semibold tracking-widest"
        style={{
          color: tone,
          backgroundColor: `color-mix(in oklab, ${tone} 16%, transparent)`,
        }}
      >
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
