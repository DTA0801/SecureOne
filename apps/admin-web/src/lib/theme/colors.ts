/** Normalize #RGB / #RRGGBB for color inputs and CSS. */
export function normalizeHex(hex: string, fallback: string): string {
  const h = hex.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(h)) return h.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(h)) {
    const [, r, g, b] = h;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const n = normalizeHex(hex, "");
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/.exec(n);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Pick readable text on a given surface when user contrast is too low. */
export function ensureReadableText(text: string, surface: string): string {
  const t = normalizeHex(text, text);
  const s = normalizeHex(surface, surface);
  if (contrastRatio(t, s) >= 4.5) return t;
  return relativeLuminance(s) > 0.5 ? "#171717" : "#ededed";
}

export function linearGradient(angle: number, from: string, to: string): string {
  return `linear-gradient(${angle}deg, ${from}, ${to})`;
}

/** Page background: gradient wash over solid base (keeps content readable). */
export function pageBackgroundGradient(
  angle: number,
  from: string,
  to: string,
  base: string,
): string {
  const f = normalizeHex(from, from);
  const t = normalizeHex(to, to);
  const b = normalizeHex(base, base);
  return `linear-gradient(${angle}deg, color-mix(in srgb, ${f} 38%, ${b}), color-mix(in srgb, ${t} 22%, ${b}))`;
}
