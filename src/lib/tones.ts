/**
 * Module color system: each terminal function family carries its own hue,
 * applied consistently to its code chip, panel accent line, and sidebar icon.
 * Color is semantic (module identity), never decorative noise.
 */

/* Brightened to glow as module hues on the dark terminal base */
export const TONE = {
  amber: "oklch(0.81 0.14 78)",
  cyan: "oklch(0.76 0.12 210)",
  blue: "oklch(0.7 0.15 258)",
  violet: "oklch(0.72 0.17 297)",
  pink: "oklch(0.74 0.18 350)",
  teal: "oklch(0.76 0.11 180)",
  green: "oklch(0.77 0.16 158)",
  orange: "oklch(0.76 0.16 50)",
  red: "oklch(0.69 0.2 25)",
} as const;

export type ToneName = keyof typeof TONE;

const CODE_TONES: Record<string, ToneName> = {
  // Overview & indices
  HOME: "amber", IDX: "amber", CHRT: "amber", LVLS: "amber", CMDT: "amber", PREC: "amber",
  // Markets & breadth
  MKT: "blue", ALLX: "blue", BRDT: "blue", FUND: "blue", BASE: "blue", NWS: "blue", NEWS: "blue", HELP: "blue", TERM: "blue",
  // Pulse / macro / comparison
  PULS: "cyan", SECT: "cyan", COMP: "cyan", PERF: "cyan", FX: "cyan", DATA: "cyan",
  ROTN: "cyan", RRG: "cyan",
  // Intelligence & earnings
  INTL: "violet", ENGN: "violet", PICK: "violet", EARN: "violet", ARCH: "violet",
  SCRN: "violet", RANK: "violet", FILT: "cyan",
  // Trading
  INTR: "green", PLAN: "green", GAIN: "green",
  LOSE: "red",
  DEAL: "orange", ENRG: "orange",
  // Personal
  PORT: "teal", HOLD: "teal", WL: "teal", WLST: "teal", ETF: "teal", READ: "teal",
  RISK: "red", SIGS: "amber", ALRT: "orange", FIN: "blue", PEER: "cyan",
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
