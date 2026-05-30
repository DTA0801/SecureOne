"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { loadAppearanceAction, saveAppearanceAction } from "@/lib/actions/settings";
import {
  applyUiPreferences,
  loadUiPreferences,
  mergeUiPreferences,
  normalizeUiPreferences,
  resolveThemeMode,
  saveUiPreferences,
} from "@/lib/theme/prefs";
import { DEFAULT_UI_PREFERENCES, type UiPreferences } from "@/lib/theme/types";

export type SaveStatus = "loading" | "idle" | "saving" | "saved" | "error";

type ThemeContextValue = {
  prefs: UiPreferences;
  setPrefs: (next: UiPreferences | ((prev: UiPreferences) => UiPreferences)) => void;
  resetPrefs: () => void;
  ready: boolean;
  saveStatus: SaveStatus;
  saveError: string | null;
  activeMode: "light" | "dark";
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function themeChangeLabel(prefs: UiPreferences, prev: UiPreferences | null): string {
  if (!prev) return "Theme loaded";
  const mode = resolveThemeMode(prefs);
  if (prev.mode !== prefs.mode) return `Theme mode: ${mode}`;
  if (prev.primaryColor !== prefs.primaryColor) return "Button & nav color updated";
  if (prev.buttonTextColor !== prefs.buttonTextColor) return "Button label text updated";
  if (prev.surfaceColor !== prefs.surfaceColor || prev.darkSurfaceColor !== prefs.darkSurfaceColor) {
    return "Card color updated";
  }
  if (prev.textColor !== prefs.textColor || prev.darkTextColor !== prefs.darkTextColor) {
    return "Text color updated";
  }
  if (prev.backgroundColor !== prefs.backgroundColor || prev.darkBackgroundColor !== prefs.darkBackgroundColor) {
    return "Page background updated";
  }
  if (prev.gradientPreset !== prefs.gradientPreset) return "Gradient style updated";
  if (prev.gradientScope !== prefs.gradientScope) return "Gradient placement updated";
  if (prev.gradientAngle !== prefs.gradientAngle) return "Gradient angle updated";
  const notifyKeys: (keyof UiPreferences)[] = [
    "notifyInfoBackground",
    "notifyInfoText",
    "notifyInfoBorder",
    "notifySuccessBackground",
    "notifySuccessText",
    "notifySuccessBorder",
    "notifyErrorBackground",
    "notifyErrorText",
    "notifyErrorBorder",
  ];
  if (notifyKeys.some((k) => prev[k] !== prefs[k])) return "Notification toast colors updated";
  return "Appearance updated";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [prefs, setPrefsState] = useState<UiPreferences>(DEFAULT_UI_PREFERENCES);
  const prevPrefs = useRef<UiPreferences | null>(null);
  const [ready, setReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("loading");
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSave = useRef(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = loadUiPreferences();
      const { prefs: api, error } = await loadAppearanceAction();
      const merged = mergeUiPreferences(api, local);
      if (!cancelled) {
        setPrefsState(merged);
        applyUiPreferences(merged);
        saveUiPreferences(merged);
        prevPrefs.current = merged;
        if (error) {
          setSaveStatus("error");
          setSaveError(`${error} Using this browser only until the server is available.`);
          toast("Could not load theme from server", "error");
        } else {
          setSaveStatus("saved");
          setSaveError(null);
          toast("Theme loaded from database", "success");
        }
        setReady(true);
        skipNextSave.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const setPrefs = useCallback(
    (next: UiPreferences | ((prev: UiPreferences) => UiPreferences)) => {
      setPrefsState((prev) => {
        const resolved = normalizeUiPreferences(
          typeof next === "function" ? next(prev) : next,
        );
        applyUiPreferences(resolved);
        if (ready) {
          toast(themeChangeLabel(resolved, prevPrefs.current), "info");
          prevPrefs.current = resolved;
        }
        return resolved;
      });
    },
    [ready, toast],
  );

  const persistPrefs = useCallback(
    async (next: UiPreferences) => {
      applyUiPreferences(next);
      saveUiPreferences(next);
      setSaveStatus("saving");
      setSaveError(null);
      const result = await saveAppearanceAction(next);
      if (result.ok) {
        setSaveStatus("saved");
        setSaveError(null);
        toast("Saved to database", "success");
      } else {
        setSaveStatus("error");
        const msg = result.error
          ? `${result.error} Changes kept in this browser only.`
          : "Failed to save appearance to database.";
        setSaveError(msg);
        toast("Save failed — using browser storage", "error");
      }
    },
    [toast],
  );

  useEffect(() => {
    if (!ready) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      persistPrefs(prefs);
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [prefs, ready, persistPrefs]);

  useEffect(() => {
    if (prefs.mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      applyUiPreferences(prefs);
      toast(`Theme mode: ${resolveThemeMode(prefs)}`, "info");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [prefs, toast]);

  const value: ThemeContextValue = {
    prefs,
    setPrefs,
    resetPrefs: () => setPrefs(DEFAULT_UI_PREFERENCES),
    ready,
    saveStatus,
    saveError,
    activeMode: resolveThemeMode(prefs),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemePrefs() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemePrefs must be used within ThemeProvider");
  return ctx;
}
