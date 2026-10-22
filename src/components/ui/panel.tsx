import { toneFor } from "@/lib/tones";
import { cn } from "@/lib/utils";

/**
 * The terminal's basic layout unit. Deliberately quiet: a flat card, a
 * sentence-case title, and the function code as a whisper-weight tag. The
 * data inside should be the loudest thing on screen, not the chrome.
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
        "panel-rise tone-scope surface-panel relative flex min-w-0 flex-col overflow-hidden rounded-lg border border-border",
        className
      )}
      style={{ "--tone": toneFor(code) } as React.CSSProperties}
    >
      {(title || right) && (
        <header className="flex h-9 shrink-0 items-center gap-2.5 border-b border-border/70 px-3">
          <h2 className="min-w-0 truncate text-[12.5px] font-medium tracking-[-0.005em] text-foreground/90">
            {title}
          </h2>
          {code && (
            <span className="num shrink-0 text-[9.5px] tracking-[0.14em] text-muted-foreground/45">
              {code}
            </span>
          )}
          <div className="ml-auto shrink-0">{right}</div>
        </header>
      )}
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}
