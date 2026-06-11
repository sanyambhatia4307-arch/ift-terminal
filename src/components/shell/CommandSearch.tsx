"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useSymbolSearch } from "@/hooks/queries";

/** Strip Yahoo suffixes so app routes use bare NSE-style symbols. */
function toAppSymbol(symbol: string): string {
  return symbol.replace(/\.(NS|BO)$/, "");
}

export function CommandSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { data: results, isFetching } = useSymbolSearch(query);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false}>
      <CommandInput
        placeholder="Search NSE / BSE stocks and indices…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {query.trim().length < 2
            ? "Type at least 2 characters…"
            : isFetching
              ? "Searching…"
              : "No results."}
        </CommandEmpty>
        {results && results.length > 0 && (
          <CommandGroup heading="Securities">
            {results.map((r) => (
              <CommandItem
                key={r.symbol}
                value={r.symbol}
                onSelect={() => {
                  onOpenChange(false);
                  setQuery("");
                  router.push(`/stock/${encodeURIComponent(toAppSymbol(r.symbol))}`);
                }}
                className="flex items-center gap-3"
              >
                <span className="num text-xs font-medium text-primary">
                  {toAppSymbol(r.symbol)}
                </span>
                <span className="flex-1 truncate text-xs">{r.name}</span>
                <span className="text-[10px] text-muted-foreground">{r.exchange}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
