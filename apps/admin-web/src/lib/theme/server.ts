import { cookies, headers } from "next/headers";
import {
  normalizeUiPreferences,
  resolveThemeColors,
  type ResolvedThemeColors,
} from "@/lib/theme/prefs";
import { DEFAULT_UI_PREFERENCES, type UiPreferences } from "@/lib/theme/types";

export const UI_PREFERENCES_COOKIE = "secureone-ui-preferences";
export const UI_THEME_MODE_COOKIE = "secureone-theme-mode";

async function readServerUiPreferences(): Promise<UiPreferences> {
  const jar = await cookies();
  const raw = jar.get(UI_PREFERENCES_COOKIE)?.value;
  if (!raw) return DEFAULT_UI_PREFERENCES;
  try {
    return normalizeUiPreferences(JSON.parse(raw) as Partial<UiPreferences>);
  } catch {
    return DEFAULT_UI_PREFERENCES;
  }
}

async function resolveServerThemeMode(prefs: UiPreferences): Promise<"light" | "dark"> {
  if (prefs.mode === "light" || prefs.mode === "dark") return prefs.mode;

  const jar = await cookies();
  const resolved = jar.get(UI_THEME_MODE_COOKIE)?.value;
  if (resolved === "dark" || resolved === "light") return resolved;

  const h = await headers();
  const hint = h.get("sec-ch-prefers-color-scheme");
  if (hint === "dark") return "dark";
  return "light";
}

function themeColorsToStyleRecord(colors: ResolvedThemeColors): Record<string, string> {
  return {
    colorScheme: colors.mode,
    "--ui-primary": colors.primary,
    "--ui-accent": colors.accent,
    "--ui-button-text": colors.buttonText,
    "--ui-background": colors.background,
    "--ui-surface": colors.surface,
    "--ui-text": colors.text,
    "--ui-radius": `${colors.radius}px`,
    "--ui-font-scale": String(colors.fontScale),
    "--ui-brand-fill": colors.brandFill,
    "--ui-page-fill": colors.pageFill,
    "--background": colors.pageFill,
    "--foreground": colors.text,
    "--ui-notify-info-bg": colors.notify.info.bg,
    "--ui-notify-info-text": colors.notify.info.text,
    "--ui-notify-info-border": colors.notify.info.border,
    "--ui-notify-success-bg": colors.notify.success.bg,
    "--ui-notify-success-text": colors.notify.success.text,
    "--ui-notify-success-border": colors.notify.success.border,
    "--ui-notify-error-bg": colors.notify.error.bg,
    "--ui-notify-error-text": colors.notify.error.text,
    "--ui-notify-error-border": colors.notify.error.border,
  };
}

/** Server-only theme bootstrap for &lt;html&gt; — no client &lt;script&gt; (React 19 safe). */
export async function getServerThemeBootstrap() {
  const prefs = await readServerUiPreferences();
  const mode = await resolveServerThemeMode(prefs);
  const colors = resolveThemeColors(prefs, mode);
  return {
    dataTheme: colors.mode,
    dataGradient: colors.gradientActive ? ("on" as const) : ("off" as const),
    style: themeColorsToStyleRecord(colors),
  };
}
