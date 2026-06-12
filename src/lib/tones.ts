/**
 * Module color system: each terminal function family carries its own hue,
 * applied consistently to its code chip, panel accent line, and sidebar icon.
 * Color is semantic (module identity), never decorative noise.
 */

export const TONE = {
  amber: "oklch(0.78 0.14 75)",
  cyan: "oklch(0.78 0.11 200)",
  blue: "oklch(0.72 0.12 255)",
  violet: "oklch(0.72 0.14 295)",
  pink: "oklch(0.72 0.14 350)",
  teal: "oklch(0.78 0.11 175)",
  green: "oklch(0.74 0.15 160)",
  orange: "oklch(0.75 0.14 50)",
  red: "oklch(0.68 0.17 22)",
} as const;

export type ToneName = keyof typeof TONE;

const CODE_TONES: Record<string, ToneName> = {
  // Overview & indices
  HOME: "amber", IDX: "amber", CHRT: "amber", LVLS: "amber", CMDT: "amber", PREC: "amber",
  // Markets & breadth
  MKT: "blue", ALLX: "blue", BRDT: "blue", FUND: "blue", BASE: "blue", NWS: "blue", NEWS: "blue", HELP: "blue", TERM: "blue",
  // Pulse / macro / comparison
  PULS: "cyan", SECT: "cyan", COMP: "cyan", PERF: "cyan", FX: "cyan", DATA: "cyan",
  // Intelligence & earnings
  INTL: "violet", ENGN: "violet", PICK: "violet", EARN: "violet", ARCH: "violet",
  // Trading
  INTR: "green", PLAN: "green", GAIN: "green",
  LOSE: "red",
  DEAL: "orange", ENRG: "orange",
  // Personal
  PORT: "teal", HOLD: "teal", WL: "teal", WLST: "teal", ETF: "teal", READ: "teal",
  // IPO
  IPO: "pink",
};

const FALLBACK: ToneName[] = ["amber", "cyan", "violet", "teal", "blue", "pink"];

export function toneFor(code?: string): string {
  if (!code) return TONE.amber;
  const named = CODE_TONES[code.toUpperCase()];
  if (named) return TONE[named];
  const hash = [...code].reduce((a, c) => a + c.charCodeAt(0), 0);
  return TONE[FALLBACK[hash % FALLBACK.length]];
}
