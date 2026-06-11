import { cn } from "@/lib/utils";

/** Dense bordered panel — the terminal's basic layout unit. */
export function Panel({
  title,
  right,
  className,
  children,
}: {
  title?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col rounded-sm border border-border bg-card",
        className
      )}
    >
      {(title || right) && (
        <header className="flex h-8 shrink-0 items-center justify-between border-b border-border px-2.5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </h2>
          {right}
        </header>
      )}
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}
