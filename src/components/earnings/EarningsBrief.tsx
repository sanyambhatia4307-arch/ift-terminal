"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { formatDistanceToNowStrict } from "date-fns";
import { Mic2 } from "lucide-react";
import { ReactionStrip } from "@/components/earnings/ReactionStrip";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import type { EarningsBrief as EarningsBriefData } from "@/app/api/earnings-brief/route";
import type { NewsItem } from "@/types/market";

export function useEarningsBrief(symbol: string, enabled = true) {
  return useQuery({
    queryKey: ["earnings-brief", symbol],
    queryFn: async () => {
      const res = await axios.get<{ ok: boolean; data: EarningsBriefData }>(
        `/api/earnings-brief?symbol=${encodeURIComponent(symbol)}`
      );
      return res.data.data;
    },
    enabled,
    staleTime: 30 * 60 * 1000,
    retry: 0,
  });
}

function NewsLinks({ items }: { items: NewsItem[] }) {
  if (items.length === 0)
    return <div className="text-[10px] text-muted-foreground">No recent coverage found.</div>;
  return (
    <div className="space-y-1">
      {items.map((n) => (
        <a
          key={n.id}
          href={n.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-sm px-1 py-0.5 text-[10.5px] leading-snug transition-colors hover:text-primary"
        >
          <span className="line-clamp-2">{n.title}</span>
          <span className="text-[9px] text-muted-foreground">
            {n.source} · {formatDistanceToNowStrict(new Date(n.publishedAt))} ago
          </span>
        </a>
      ))}
    </div>
  );
}

/** Full three-section brief · used in the earnings-row expansion. */
export function EarningsBriefBody({ symbol }: { symbol: string }) {
  const { data, isLoading } = useEarningsBrief(symbol);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 p-3 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }
  if (!data) return <div className="p-3 text-xs text-muted-foreground">Brief unavailable.</div>;

  const sections: Array<[string, string | undefined, NewsItem[]]> = [
    ["Financials Announced", data.summary?.financials, data.resultNews],
    ["Key Discussions in the Report", data.summary?.discussions, []],
    ["Management Commentary", data.summary?.managementCommentary, data.commentaryNews],
  ];

  return (
    <div className="border-l-2 border-primary/40 bg-background/40">
      <div className="border-b border-border/60">
        <ReactionStrip symbol={symbol} />
      </div>
      <div className="grid grid-cols-1 gap-x-5 gap-y-3 p-3 lg:grid-cols-3">
        {sections.map(([title, summary, news]) => (
          <div key={title}>
            <div className="mb-1 text-[9px] font-semibold uppercase tracking-widest text-primary">
              {title}
            </div>
            {summary ? (
              <p className="mb-1.5 text-[11px] leading-relaxed text-foreground/90">{summary}</p>
            ) : (
              <p className="mb-1.5 text-[10px] text-muted-foreground">
                AI synthesis off (no API key) · read the source coverage:
              </p>
            )}
            <NewsLinks items={news} />
          </div>
        ))}
      </div>
      <p className="px-3 pb-2 text-[9px] text-muted-foreground">
        Synthesised from live news coverage of the most recent reported quarter
        {data.summary ? " by Claude" : ""} · verify against the company's filings before acting.
      </p>
    </div>
  );
}

/** Compact management-commentary panel for the stock research page. */
export function ManagementCommentary({ symbol }: { symbol: string }) {
  const { data, isLoading } = useEarningsBrief(symbol);

  return (
    <Panel
      code="MGMT"
      title={
        <span className="flex items-center gap-1.5">
          <Mic2 className="h-3 w-3" /> Management Commentary · latest results
        </span>
      }
      right={
        data ? (
          <span className="num text-[10px] text-muted-foreground">
            {data.summary ? "AI summary + sources" : "source coverage"}
          </span>
        ) : null
      }
    >
      {isLoading ? (
        <Skeleton className="m-2 h-24" />
      ) : !data ? (
        <div className="p-3 text-xs text-muted-foreground">No commentary coverage found.</div>
      ) : (
        <div className="space-y-2 p-2.5">
          {data.summary && (
            <>
              <p className="text-[11px] leading-relaxed text-foreground/90">
                {data.summary.managementCommentary}
              </p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground/80">Results context: </span>
                {data.summary.financials}
              </p>
            </>
          )}
          <div className="grid grid-cols-1 gap-x-4 gap-y-1 border-t border-border/60 pt-1.5 md:grid-cols-2">
            <NewsLinks items={data.commentaryNews.slice(0, 4)} />
            <NewsLinks items={data.resultNews.slice(0, 4)} />
          </div>
          <div className="-mx-2.5 border-t border-border/60">
            <ReactionStrip symbol={symbol} />
          </div>
        </div>
      )}
    </Panel>
  );
}
