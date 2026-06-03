"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { useThemePrefs } from "@/components/ThemeProvider";
import { AppearanceThemeEditor } from "@/components/settings/appearance/AppearanceThemeEditor";
import {
  isGradientActive,
  resolveGradientStops,
  resolveThemeColors,
  resolveThemeMode,
} from "@/lib/theme/prefs";

function saveStatusLabel(status: string, error: string | null): string | null {
  if (status === "loading") return "Loading saved theme…";
  if (status === "saving") return "Saving to database…";
  if (status === "saved") return "Saved to database — persists after refresh.";
  if (status === "error") return error ?? "Save failed.";
  return null;
}

export function AppearanceSettings() {
  const { prefs, setPrefs, resetPrefs, ready, saveStatus, saveError, activeMode } = useThemePrefs();
  const previewMode = resolveThemeMode(prefs);
  const resolved = resolveThemeColors(prefs, previewMode);
  const gradient = resolveGradientStops(prefs);
  const gradientOn = isGradientActive(prefs);

  return (
    <Card padded={false}>
      <CardHeader
        title="Platform appearance"
        description={`Admin console theme only (currently editing ${activeMode} mode). Does not affect client applications — use each app's Appearance tab and Public API for client themes.`}
        action={
          <Button variant="ghost" size="sm" onClick={resetPrefs}>
            Reset defaults
          </Button>
        }
      />
      {saveStatusLabel(saveStatus, saveError) && (
        <p
          className={`mx-5 mt-4 rounded-lg px-3 py-2 text-sm ${
            saveStatus === "error"
              ? "bg-red-500/10 text-red-700 dark:text-red-300"
              : "bg-brand-muted text-brand"
          }`}
        >
          {saveStatusLabel(saveStatus, saveError)}
        </p>
      )}
      <AppearanceThemeEditor prefs={prefs} setPrefs={setPrefs} ready={ready} showNotifyPreviews />
      <div className="border-t border-ui p-5">
        <p className="mb-1 text-xs text-faint">
          Admin console preview ({previewMode} mode{gradientOn ? ", gradient on" : ""})
        </p>
        <div
          className="rounded-xl border p-4"
          style={{
            background: resolved.surface,
            color: resolved.text,
            borderRadius: resolved.radius,
            borderColor: `${resolved.primary}33`,
          }}
        >
          <p className="font-semibold" style={{ color: resolved.primary }}>
            SecureOne Admin
          </p>
          <p className="mt-1 text-sm opacity-80">Platform console uses these colors.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg px-3 py-1.5 text-sm font-medium"
              style={{
                background: resolved.brandFill,
                color: resolved.buttonText,
                borderRadius: resolved.radius,
              }}
            >
              Primary action
            </button>
            <span
              className="rounded-lg px-3 py-1.5 text-sm font-medium"
              style={{
                color: resolved.accent,
                background: `${resolved.accent}22`,
                borderRadius: resolved.radius,
              }}
            >
              Accent highlight
            </span>
          </div>
          {gradientOn && (
            <div
              className="mt-3 h-8 rounded-lg"
              style={{ background: `linear-gradient(${gradient.angle}deg, ${gradient.from}, ${gradient.to})` }}
            />
          )}
        </div>
      </div>
    </Card>
  );
}
