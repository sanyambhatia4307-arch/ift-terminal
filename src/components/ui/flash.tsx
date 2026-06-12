"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Flashes green/red when the watched numeric value ticks up/down. */
export function FlashValue({
  value,
  children,
  className,
}: {
  value: number | undefined;
  children: React.ReactNode;
  className?: string;
}) {
  const prev = useRef<number | undefined>(undefined);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (value === undefined) return;
    if (prev.current !== undefined && value !== prev.current) {
      setFlash(value > prev.current ? "up" : "down");
      const id = setTimeout(() => setFlash(null), 950);
      prev.current = value;
      return () => clearTimeout(id);
    }
    prev.current = value;
  }, [value]);

  return (
    <span
      className={cn(
        "rounded-[2px] px-0.5 transition-colors",
        flash === "up" && "flash-up",
        flash === "down" && "flash-down",
        className
      )}
    >
      {children}
    </span>
  );
}
