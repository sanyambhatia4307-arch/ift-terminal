import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="num rounded-sm border border-border bg-card/60 px-2 py-0.5 text-[10px] font-semibold tracking-widest text-primary">
        ERR 404
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">
        <span className="text-gradient">Symbol not found</span>
      </h1>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        This page isn&apos;t listed on the terminal. It may have moved, or the URL has a typo.
      </p>
      <div className="flex items-center gap-3 text-sm">
        <Link
          href="/"
          className="rounded-sm border border-primary/50 bg-primary/15 px-3 py-1.5 text-primary transition-colors hover:bg-primary/25"
        >
          Back to dashboard
        </Link>
        <Link href="/screener" className="text-muted-foreground transition-colors hover:text-foreground">
          Open the screener
        </Link>
      </div>
    </div>
  );
}
