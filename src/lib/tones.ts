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

/**
 * Chrome (panel chips, page headers, nav) is deliberately monochrome: one
 * amber accent everywhere. Distinct hues are reserved for data, where colour
 * carries meaning (TONE above, used by charts, donuts and sector bars).
 */
export const ACCENT = "oklch(0.8 0.13 78)";

export function toneFor(_code?: string): string {
  return ACCENT;
}
