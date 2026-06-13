import { toneFor } from "@/lib/tones";
import { cn } from "@/lib/utils";

/**
 * Dense bordered panel · the terminal's basic layout unit.
 * `code` renders a Bloomberg-style function tag and drives the panel's
 * module hue (chip color + header accent line) via the tone system.
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
  const tone = toneFor(code);
  return (
    <section
      className={cn(
        "panel-rise hover-glow tone-scope surface-panel relative flex min-w-0 flex-col overflow-hidden rounded-md border border-border",
        className
      )}
      style={{ "--tone": tone } as React.CSSProperties}
    >
      {(title || right) && (
        <header className="relative flex h-8 shrink-0 items-center gap-2 border-b border-border bg-secondary/30 px-2.5">
          {/* Module accent hairline */}
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-[2px]"
            style={{
              background: `linear-gradient(90deg, ${tone}, color-mix(in oklab, ${tone} 20%, transparent) 55%, transparent)`,
            }}
          />
          {code && (
            <span
              className="num rounded-[2px] px-1 py-px text-[9px] font-semibold tracking-widest"
              style={{
                color: tone,
                backgroundColor: `color-mix(in oklab, ${tone} 16%, transparent)`,
              }}
            >
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
