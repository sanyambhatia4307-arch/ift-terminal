const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const inrInt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function fmt(n: number | undefined | null, digits = 2): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return digits === 0 ? inrInt.format(n) : inr.format(n);
}

/** Indian-system compact: crores / lakhs. Input in rupees. */
export function fmtInrCompact(n: number | undefined | null): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e12) return `₹${(n / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`;
  if (abs >= 1e7) return `₹${(n / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Cr`;
  if (abs >= 1e5) return `₹${(n / 1e5).toLocaleString("en-IN", { maximumFractionDigits: 2 })} L`;
  return `₹${inr.format(n)}`;
}

export function fmtVolume(n: number | undefined | null): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  if (n >= 1e7) return `${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `${(n / 1e5).toFixed(2)} L`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} K`;
  return String(n);
}

export function fmtPct(n: number | undefined | null, signed = true): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  const sign = signed && n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function fmtChange(n: number | undefined | null): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return `${n > 0 ? "+" : ""}${inr.format(n)}`;
}

export function changeClass(n: number | undefined | null): string {
  if (n === undefined || n === null || n === 0) return "text-flat";
  return n > 0 ? "text-bull" : "text-bear";
}
