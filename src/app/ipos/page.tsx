"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { formatDistanceToNowStrict } from "date-fns";
import { AlertOctagon, Rocket } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { IpoDossier } from "@/lib/data/ipos";
import type { NewsItem } from "@/types/market";

type IpoWithNews = IpoDossier & { news: NewsItem[] };

function useIpos() {
  return useQuery({
    queryKey: ["ipos"],
    queryFn: async () => {
      const res = await axios.get<{ ok: boolean; data: { asOf: string; ipos: IpoWithNews[] } }>(
        "/api/ipos"
      );
      return res.data.data;
    },
    staleTime: 10 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}

const GAIN_STYLES = {
  positive: "border-bull/40 bg-bull/10 text-bull",
  neutral: "border-primary/40 bg-primary/10 text-primary",
  caution: "border-bear/40 bg-bear/10 text-bear",
} as const;

const GAIN_LABEL = {
  positive: "Listing-gain setup: favourable",
  neutral: "Listing-gain setup: balanced",
  caution: "Listing-gain setup: caution",
} as const;

function IpoCard({ ipo }: { ipo: IpoWithNews }) {
  return (
    <Panel
      title={
        <span className="normal-case">
          {ipo.company}
          <span className="ml-2 font-normal text-muted-foreground">{ipo.sector}</span>
        </span>
      }
      right={
        <span className="rounded-sm border border-border px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">
          {ipo.status}
        </span>
      }
    >
      <div className="grid grid-cols-1 gap-3 p-2.5 lg:grid-cols-3">
        <div className="space-y-1.5 text-[11px]">
          <div>
            <span className="text-muted-foreground">Valuation: </span>
            {ipo.valuation}
          </div>
          <div>
            <span className="text-muted-foreground">Issue size: </span>
            {ipo.issueSize}
          </div>
          <div>
            <span className="text-muted-foreground">Structure: </span>
            {ipo.structure}
          </div>
          <div>
            <span className="text-muted-foreground">Timeline: </span>
            {ipo.expectedTimeline}
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-border/60 pt-1.5">
            {ipo.metrics.map(([k, v]) => (
              <div key={k}>
                <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{k}</div>
                <div>{v}</div>
              </div>
            ))}
          </div>
          <div
            className={cn(
              "mt-1 rounded-sm border px-2 py-1.5 text-[10px] leading-snug",
              GAIN_STYLES[ipo.gainSentiment]
            )}
          >
            <div className="font-semibold">{GAIN_LABEL[ipo.gainSentiment]}</div>
            <div className="mt-0.5 text-foreground/80">{ipo.expectedListingGain}</div>
          </div>
        </div>

        <div className="text-[11px]">
          <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-bear">
            <AlertOctagon className="h-3 w-3" /> DRHP / Risk Flags
          </div>
          <ul className="space-y-1.5">
            {ipo.drhpFlags.map((flag, i) => (
              <li key={i} className="flex gap-1.5 leading-snug">
                <span className="text-bear">▸</span>
                <span className="text-foreground/85">{flag}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-[11px]">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Live News
          </div>
          {ipo.news.length === 0 ? (
            <div className="text-muted-foreground">No recent stories.</div>
          ) : (
            <div className="space-y-1.5">
              {ipo.news.map((n) => (
                <a
                  key={n.id}
                  href={n.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block leading-snug transition-colors hover:text-primary"
                >
                  <span className="line-clamp-2">{n.title}</span>
                  <span className="text-[9px] text-muted-foreground">
                    {n.source} · {formatDistanceToNowStrict(new Date(n.publishedAt))} ago
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

export default function IposPage() {
  const { data, isLoading } = useIpos();

  return (
    <div className="space-y-2 p-2">
      <div className="flex items-center gap-2">
        <Rocket className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">IPO Intelligence · Indian Pipeline</span>
        {data && (
          <span className="num ml-auto text-[10px] text-muted-foreground">
            Dossiers reviewed {data.asOf} · news live (10m refresh)
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : (
        <>
          {data?.ipos.map((ipo) => <IpoCard key={ipo.id} ipo={ipo} />)}
          <p className="px-1 text-[9px] leading-snug text-muted-foreground">
            Dossier fields (valuation, structure, risk flags) are editorial research summaries of
            public filings and reporting as of the review date; news links are live. Grey-market
            premium (GMP) is unofficial, illiquid and volatile — listing-gain setups are
            qualitative reads, not forecasts. Not investment advice.
          </p>
        </>
      )}
    </div>
  );
}
