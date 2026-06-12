import { cn } from "@/lib/utils";

/**
 * Dense bordered panel — the terminal's basic layout unit.
 * `code` renders a Bloomberg-style function tag (e.g. IDX, MOVR) — part of
 * the terminal's visual signature.
 */
export function Panel({
  title,
  code,
  right,
  className,
  children,
}: {
  title?: React.ReactNode;
  code?: string;
  right?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "panel-rise hover-glow flex min-w-0 flex-col rounded-sm border border-border bg-card",
        className
      )}
    >
      {(title || right) && (
        <header className="flex h-8 shrink-0 items-center gap-2 border-b border-border bg-secondary/30 px-2.5">
          {code && (
            <span className="num rounded-[2px] bg-primary/15 px-1 py-px text-[9px] font-semibold tracking-widest text-primary">
              {code}
            </span>
          )}
          <h2 className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </h2>
          <div className="ml-auto shrink-0">{right}</div>
        </header>
      )}
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}
