"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useNews } from "@/hooks/queries";

export function NewsPanel({
  query,
  count = 10,
  title = "Market News",
  className,
  scrollable = false,
}: {
  query?: string;
  count?: number;
  title?: string;
  className?: string;
  scrollable?: boolean;
}) {
  const { data, isLoading } = useNews(query);

  return (
    <Panel code="NEWS" title={title} className={className}>
      {isLoading ? (
        <div className="space-y-2 p-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
      ) : (
        <div
          className={
            scrollable
              ? "h-full divide-y divide-border/60 overflow-y-auto"
              : "divide-y divide-border/60 overflow-y-auto"
          }
        >
          {data?.slice(0, count).map((item) => (
            <a
              key={item.id}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-2.5 py-2 transition-colors hover:bg-accent/40"
            >
              <div className="line-clamp-2 text-xs leading-snug">{item.title}</div>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="truncate">{item.source}</span>
                <span>·</span>
                <span className="num shrink-0">
                  {formatDistanceToNowStrict(new Date(item.publishedAt))} ago
                </span>
              </div>
            </a>
          ))}
          {data?.length === 0 && (
            <div className="p-3 text-xs text-muted-foreground">No news available.</div>
          )}
        </div>
      )}
    </Panel>
  );
}
