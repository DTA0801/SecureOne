import { linearGradient, normalizeHex, pageBackgroundGradient } from "./colors";
import {
  DARK_THEME_COLORS,
  DEFAULT_UI_PREFERENCES,
  GRADIENT_PRESETS,
  type GradientPreset,
  type GradientScope,
  type ThemeMode,
  type UiPreferences,
} from "./types";

const STORAGE_KEY = "secureone-ui-preferences";
const THEME_MODE_COOKIE = "secureone-theme-mode";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function writeThemeCookies(prefs: UiPreferences): void {
  if (typeof document === "undefined") return;
  const encoded = encodeURIComponent(JSON.stringify(prefs));
  const base = `path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
  document.cookie = `${STORAGE_KEY}=${encoded};${base}`;
  document.cookie = `${THEME_MODE_COOKIE}=${resolveThemeMode(prefs)};${base}`;
}

const GRADIENT_PRESET_VALUES: GradientPreset[] = ["none", "brand", "sunset", "ocean", "violet", "custom"];
const GRADIENT_SCOPE_VALUES: GradientScope[] = ["page", "brand", "both"];
const THEME_MODE_VALUES: ThemeMode[] = ["light", "dark", "system"];

type PrefsInput = Partial<UiPreferences> & { gradientEnabled?: boolean };

function coerceEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  if (typeof value === "string" && (allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  return fallback;
}

function coerceNumber(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** Coerce API/localStorage payloads so selects and gradient math never break. */
export function normalizeUiPreferences(input: PrefsInput = {}): UiPreferences {
  const d = DEFAULT_UI_PREFERENCES;
  const merged: UiPreferences = {
    ...d,
    ...input,
    mode: coerceEnum(input.mode, THEME_MODE_VALUES, d.mode),
    gradientPreset: coerceEnum(input.gradientPreset, GRADIENT_PRESET_VALUES, d.gradientPreset),
    gradientScope: coerceEnum(input.gradientScope, GRADIENT_SCOPE_VALUES, d.gradientScope),
    buttonTextColor: input.buttonTextColor ?? d.buttonTextColor,
    gradientAngle: coerceNumber(input.gradientAngle, d.gradientAngle, 0, 360),
    borderRadius: coerceNumber(input.borderRadius, d.borderRadius, 4, 24),
    fontScale: coerceNumber(input.fontScale, d.fontScale, 0.85, 1.25),
  };

  if (input.gradientEnabled === true && merged.gradientPreset === "none") {
    merged.gradientPreset = "brand";
  }

  return merged;
}

/** Merge localStorage + API (API wins on conflict) with safe defaults. */
export function mergeUiPreferences(
  api: Partial<UiPreferences>,
  local: Partial<UiPreferences>,
): UiPreferences {
  const apiLegacy = api as PrefsInput;
  const localLegacy = local as PrefsInput;
  return normalizeUiPreferences({
    ...local,
    ...api,
    gradientEnabled: apiLegacy.gradientEnabled ?? localLegacy.gradientEnabled,
  });
}

export function loadUiPreferences(): UiPreferences {
  if (typeof window === "undefined") return DEFAULT_UI_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_UI_PREFERENCES;
    const parsed = JSON.parse(raw) as PrefsInput;
    return normalizeUiPreferences(parsed);
  } catch {
    return DEFAULT_UI_PREFERENCES;
  }
}

/** Apply a gradient style preset and sync from/to/angle fields used by custom mode. */
export function applyGradientPreset(prefs: UiPreferences, preset: GradientPreset): UiPreferences {
  const next: UiPreferences = { ...prefs, gradientPreset: preset };
  if (preset === "brand") {
    return normalizeUiPreferences({
      ...next,
      gradientFrom: prefs.primaryColor,
      gradientTo: prefs.accentColor,
    });
  }
  if (preset !== "none" && preset !== "custom") {
    const p = GRADIENT_PRESETS[preset];
    return normalizeUiPreferences({
      ...next,
      gradientFrom: p.from,
      gradientTo: p.to,
      gradientAngle: p.angle,
    });
  }
  return normalizeUiPreferences(next);
}

export function saveUiPreferences(prefs: UiPreferences): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  writeThemeCookies(prefs);
}

export function resolveThemeMode(
  prefs: UiPreferences,
  fallback: "light" | "dark" = "light",
): "light" | "dark" {
  if (prefs.mode === "light" || prefs.mode === "dark") return prefs.mode;
  if (typeof window === "undefined") return fallback;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function isGradientActive(prefs: UiPreferences): boolean {
  return prefs.gradientPreset !== "none";
}

export function resolveGradientStops(prefs: UiPreferences): { from: string; to: string; angle: number } {
  if (prefs.gradientPreset === "none") {
    return { from: prefs.primaryColor, to: prefs.accentColor, angle: prefs.gradientAngle };
  }
  if (prefs.gradientPreset === "custom") {
    return {
      from: normalizeHex(prefs.gradientFrom, prefs.primaryColor),
      to: normalizeHex(prefs.gradientTo, prefs.accentColor),
      angle: prefs.gradientAngle,
    };
  }
  if (prefs.gradientPreset === "brand") {
    return {
      from: normalizeHex(prefs.primaryColor, DEFAULT_UI_PREFERENCES.primaryColor),
      to: normalizeHex(prefs.accentColor, DEFAULT_UI_PREFERENCES.accentColor),
      angle: prefs.gradientAngle,
    };
  }
  const preset = GRADIENT_PRESETS[prefs.gradientPreset];
  return {
    from: normalizeHex(preset.from, prefs.primaryColor),
    to: normalizeHex(preset.to, prefs.accentColor),
    angle: coerceNumber(prefs.gradientAngle, preset.angle, 0, 360),
  };
}

export type ResolvedThemeColors = {
  mode: "light" | "dark";
  primary: string;
  accent: string;
  buttonText: string;
  background: string;
  surface: string;
  text: string;
  radius: number;
  fontScale: number;
  gradientActive: boolean;
  brandFill: string;
  pageFill: string;
  notify: {
    info: { bg: string; text: string; border: string };
    success: { bg: string; text: string; border: string };
    error: { bg: string; text: string; border: string };
  };
};

function resolveNotifyColors(prefs: UiPreferences) {
  const d = DEFAULT_UI_PREFERENCES;
  return {
    info: {
      bg: normalizeHex(prefs.notifyInfoBackground, d.notifyInfoBackground),
      text: normalizeHex(prefs.notifyInfoText, d.notifyInfoText),
      border: normalizeHex(prefs.notifyInfoBorder, d.notifyInfoBorder),
    },
    success: {
      bg: normalizeHex(prefs.notifySuccessBackground, d.notifySuccessBackground),
      text: normalizeHex(prefs.notifySuccessText, d.notifySuccessText),
      border: normalizeHex(prefs.notifySuccessBorder, d.notifySuccessBorder),
    },
    error: {
      bg: normalizeHex(prefs.notifyErrorBackground, d.notifyErrorBackground),
      text: normalizeHex(prefs.notifyErrorText, d.notifyErrorText),
      border: normalizeHex(prefs.notifyErrorBorder, d.notifyErrorBorder),
    },
  };
}

export function resolveThemeColors(prefs: UiPreferences, mode: "light" | "dark"): ResolvedThemeColors {
  const primary = normalizeHex(prefs.primaryColor, DEFAULT_UI_PREFERENCES.primaryColor);
  const accent = normalizeHex(prefs.accentColor, DEFAULT_UI_PREFERENCES.accentColor);

  const background = normalizeHex(
    mode === "dark" ? prefs.darkBackgroundColor : prefs.backgroundColor,
    mode === "dark" ? DARK_THEME_COLORS.backgroundColor : DEFAULT_UI_PREFERENCES.backgroundColor,
  );
  const surface = normalizeHex(
    mode === "dark" ? prefs.darkSurfaceColor : prefs.surfaceColor,
    mode === "dark" ? DARK_THEME_COLORS.surfaceColor : DEFAULT_UI_PREFERENCES.surfaceColor,
  );
  const text = normalizeHex(
    mode === "dark" ? prefs.darkTextColor : prefs.textColor,
    mode === "dark" ? DARK_THEME_COLORS.textColor : DEFAULT_UI_PREFERENCES.textColor,
  );
  const buttonText = normalizeHex(
    prefs.buttonTextColor,
    DEFAULT_UI_PREFERENCES.buttonTextColor,
  );

  const gradientActive = isGradientActive(prefs);
  const { from, to, angle } = resolveGradientStops(prefs);
  const grad = linearGradient(angle, from, to);
  const scope = prefs.gradientScope;

  const brandFill =
    gradientActive && (scope === "brand" || scope === "both") ? grad : primary;
  const pageFill =
    gradientActive && (scope === "page" || scope === "both")
      ? pageBackgroundGradient(angle, from, to, background)
      : background;

  return {
    mode,
    primary,
    accent,
    buttonText,
    background,
    surface,
    text,
    radius: prefs.borderRadius,
    fontScale: prefs.fontScale,
    gradientActive,
    brandFill,
    pageFill,
    notify: resolveNotifyColors(prefs),
  };
}

export function applyThemeVars(root: HTMLElement, colors: ResolvedThemeColors): void {
  root.dataset.theme = colors.mode;
  root.dataset.gradient = colors.gradientActive ? "on" : "off";
  root.style.colorScheme = colors.mode;
  root.style.setProperty("--ui-primary", colors.primary);
  root.style.setProperty("--ui-accent", colors.accent);
  root.style.setProperty("--ui-button-text", colors.buttonText);
  root.style.setProperty("--ui-background", colors.background);
  root.style.setProperty("--ui-surface", colors.surface);
  root.style.setProperty("--ui-text", colors.text);
  root.style.setProperty("--ui-radius", `${colors.radius}px`);
  root.style.setProperty("--ui-font-scale", String(colors.fontScale));
  root.style.setProperty("--ui-brand-fill", colors.brandFill);
  root.style.setProperty("--ui-page-fill", colors.pageFill);
  root.style.setProperty("--background", colors.pageFill);
  root.style.setProperty("--foreground", colors.text);
  root.style.setProperty("--ui-notify-info-bg", colors.notify.info.bg);
  root.style.setProperty("--ui-notify-info-text", colors.notify.info.text);
  root.style.setProperty("--ui-notify-info-border", colors.notify.info.border);
  root.style.setProperty("--ui-notify-success-bg", colors.notify.success.bg);
  root.style.setProperty("--ui-notify-success-text", colors.notify.success.text);
  root.style.setProperty("--ui-notify-success-border", colors.notify.success.border);
  root.style.setProperty("--ui-notify-error-bg", colors.notify.error.bg);
  root.style.setProperty("--ui-notify-error-text", colors.notify.error.text);
  root.style.setProperty("--ui-notify-error-border", colors.notify.error.border);
}

export function applyUiPreferences(prefs: UiPreferences): void {
  if (typeof document === "undefined") return;
  const mode = resolveThemeMode(prefs);
  applyThemeVars(document.documentElement, resolveThemeColors(prefs, mode));
}

export function themeModeLabel(mode: ThemeMode): string {
  if (mode === "system") return "System";
  return mode === "dark" ? "Dark" : "Light";
}
