"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useNews } from "@/hooks/queries";

const TOPICS = [
  { label: "Markets", query: undefined },
  { label: "Earnings", query: "indian company quarterly results earnings" },
  { label: "RBI & Macro", query: "RBI repo rate india inflation GDP" },
  { label: "IPOs", query: "india IPO listing NSE BSE" },
  { label: "Global", query: "global markets fed dow nasdaq asia" },
];

export default function NewsPage() {
  const [topic, setTopic] = useState(0);
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const query = activeSearch || TOPICS[topic].query;
  const { data, isLoading } = useNews(query);

  return (
    <div className="space-y-2 p-2">
      <div className="flex flex-wrap items-center gap-2">
        {TOPICS.map((t, i) => (
          <button
            key={t.label}
            onClick={() => {
              setTopic(i);
              setActiveSearch("");
              setSearch("");
            }}
            className={`rounded-sm border px-2.5 py-1 text-xs transition-colors ${
              i === topic && !activeSearch
                ? "border-primary/50 bg-accent text-primary"
                : "border-border text-muted-foreground hover:bg-accent/50"
            }`}
          >
            {t.label}
          </button>
        ))}
        <form
          className="relative ml-auto"
          onSubmit={(e) => {
            e.preventDefault();
            setActiveSearch(search.trim());
          }}
        >
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search news…"
            className="h-7 w-64 pl-7 text-xs"
          />
        </form>
      </div>

      <Panel title={activeSearch ? `News · "${activeSearch}"` : `News · ${TOPICS[topic].label}`}>
        {isLoading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {data?.slice(0, 50).map((item) => (
              <a
                key={item.id}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-baseline gap-3 px-3 py-2 transition-colors hover:bg-accent/40"
              >
                <span className="num w-20 shrink-0 text-[10px] text-muted-foreground">
                  {formatDistanceToNowStrict(new Date(item.publishedAt))} ago
                </span>
                <span className="flex-1 text-[13px] leading-snug">{item.title}</span>
                <span className="hidden w-40 shrink-0 truncate text-right text-[10px] text-muted-foreground md:block">
                  {item.source}
                </span>
              </a>
            ))}
            {data?.length === 0 && (
              <div className="p-4 text-xs text-muted-foreground">No stories found.</div>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}
