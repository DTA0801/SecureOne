"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { FieldRow, Input, Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useThemePrefs } from "@/components/ThemeProvider";
import {
  applyGradientPreset,
  isGradientActive,
  resolveGradientStops,
  resolveThemeColors,
  resolveThemeMode,
} from "@/lib/theme/prefs";
import {
  DEFAULT_UI_PREFERENCES,
  type GradientPreset,
  type GradientScope,
} from "@/lib/theme/types";

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <FieldRow label={label}>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded border border-ui"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </FieldRow>
  );
}

function saveStatusLabel(status: string, error: string | null): string | null {
  if (status === "loading") return "Loading saved theme…";
  if (status === "saving") return "Saving to database…";
  if (status === "saved") return "Saved to database — persists after refresh.";
  if (status === "error") return error ?? "Save failed.";
  return null;
}

function NotifyVariantFields({
  title,
  background,
  text,
  border,
  onBackground,
  onText,
  onBorder,
}: {
  title: string;
  background: string;
  text: string;
  border: string;
  onBackground: (hex: string) => void;
  onText: (hex: string) => void;
  onBorder: (hex: string) => void;
}) {
  return (
    <>
      <div className="md:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-faint">{title}</p>
      </div>
      <ColorField label="Background" value={background} onChange={onBackground} />
      <ColorField label="Text" value={text} onChange={onText} />
      <ColorField label="Border" value={border} onChange={onBorder} />
    </>
  );
}

export function AppearanceSettings() {
  const { toast } = useToast();
  const { prefs, setPrefs, resetPrefs, ready, saveStatus, saveError, activeMode } = useThemePrefs();
  const previewMode = resolveThemeMode(prefs);
  const resolved = resolveThemeColors(prefs, previewMode);
  const gradient = resolveGradientStops(prefs);
  const gradientOn = isGradientActive(prefs);

  return (
    <Card padded={false}>
      <CardHeader
        title="Appearance"
        description={`Customize colors for the whole app. Currently editing ${activeMode} mode — changes apply instantly with a popup, then save to the database.`}
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
      <div className={`grid grid-cols-1 gap-5 p-5 md:grid-cols-2 ${!ready ? "pointer-events-none opacity-60" : ""}`}>
        <FieldRow label="Theme mode">
          <Select
            value={prefs.mode}
            onChange={(e) => setPrefs({ ...prefs, mode: e.target.value as typeof prefs.mode })}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </Select>
        </FieldRow>
        <FieldRow label="Font scale">
          <Input
            type="number"
            min={0.85}
            max={1.25}
            step={0.05}
            value={prefs.fontScale}
            onChange={(e) => setPrefs({ ...prefs, fontScale: Number(e.target.value) })}
          />
        </FieldRow>

        <div className="md:col-span-2">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-faint">Buttons & navigation</p>
          <p className="mb-3 text-xs text-muted">Primary buttons, active sidebar tab, and solid button fills.</p>
        </div>
        <ColorField
          label="Button / nav color"
          value={prefs.primaryColor}
          onChange={(primaryColor) => {
            const next = { ...prefs, primaryColor };
            if (prefs.gradientPreset === "brand") {
              next.gradientFrom = primaryColor;
            }
            setPrefs(next);
          }}
        />
        <ColorField
          label="Button label text"
          value={prefs.buttonTextColor}
          onChange={(buttonTextColor) => setPrefs({ ...prefs, buttonTextColor })}
        />
        <p className="md:col-span-2 -mt-2 text-xs text-muted">
          Uses CSS class <code className="rounded bg-ui-elevated px-1 font-mono text-[10px]">text-on-brand</code> on
          primary buttons (not <code className="font-mono text-[10px]">text-white</code>, which ignored your setting).
        </p>
        <ColorField
          label="Links & accent"
          value={prefs.accentColor}
          onChange={(accentColor) => {
            const next = { ...prefs, accentColor };
            if (prefs.gradientPreset === "brand") {
              next.gradientTo = accentColor;
            }
            setPrefs(next);
          }}
        />

        <div className="md:col-span-2">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-faint">Light mode — page & cards</p>
          <p className="mb-3 text-xs text-muted">Used when theme mode is Light (or System with a light OS theme).</p>
        </div>
        <ColorField
          label="Page background"
          value={prefs.backgroundColor}
          onChange={(backgroundColor) => setPrefs({ ...prefs, backgroundColor })}
        />
        <ColorField
          label="Cards & panels"
          value={prefs.surfaceColor}
          onChange={(surfaceColor) => setPrefs({ ...prefs, surfaceColor })}
        />
        <ColorField
          label="Body text"
          value={prefs.textColor}
          onChange={(textColor) => setPrefs({ ...prefs, textColor })}
        />

        <div className="md:col-span-2">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-faint">Dark mode — page & cards</p>
          <p className="mb-3 text-xs text-muted">Used when theme mode is Dark (or System with a dark OS theme).</p>
        </div>
        <ColorField
          label="Page background"
          value={prefs.darkBackgroundColor}
          onChange={(darkBackgroundColor) => setPrefs({ ...prefs, darkBackgroundColor })}
        />
        <ColorField
          label="Cards & panels"
          value={prefs.darkSurfaceColor}
          onChange={(darkSurfaceColor) => setPrefs({ ...prefs, darkSurfaceColor })}
        />
        <ColorField
          label="Body text"
          value={prefs.darkTextColor}
          onChange={(darkTextColor) => setPrefs({ ...prefs, darkTextColor })}
        />

        <div className="md:col-span-2 border-t border-ui pt-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-faint">Popup notifications</p>
          <p className="mb-3 text-xs text-muted">
            Toast messages (bottom-right) use CSS classes{" "}
            <code className="rounded bg-ui-elevated px-1 font-mono text-[10px]">toast-info</code>,{" "}
            <code className="font-mono text-[10px]">toast-success</code>, and{" "}
            <code className="font-mono text-[10px]">toast-error</code>.
          </p>
        </div>
        <NotifyVariantFields
          title="Info toasts"
          background={prefs.notifyInfoBackground}
          text={prefs.notifyInfoText}
          border={prefs.notifyInfoBorder}
          onBackground={(notifyInfoBackground) => setPrefs({ ...prefs, notifyInfoBackground })}
          onText={(notifyInfoText) => setPrefs({ ...prefs, notifyInfoText })}
          onBorder={(notifyInfoBorder) => setPrefs({ ...prefs, notifyInfoBorder })}
        />
        <NotifyVariantFields
          title="Success toasts"
          background={prefs.notifySuccessBackground}
          text={prefs.notifySuccessText}
          border={prefs.notifySuccessBorder}
          onBackground={(notifySuccessBackground) => setPrefs({ ...prefs, notifySuccessBackground })}
          onText={(notifySuccessText) => setPrefs({ ...prefs, notifySuccessText })}
          onBorder={(notifySuccessBorder) => setPrefs({ ...prefs, notifySuccessBorder })}
        />
        <NotifyVariantFields
          title="Error toasts"
          background={prefs.notifyErrorBackground}
          text={prefs.notifyErrorText}
          border={prefs.notifyErrorBorder}
          onBackground={(notifyErrorBackground) => setPrefs({ ...prefs, notifyErrorBackground })}
          onText={(notifyErrorText) => setPrefs({ ...prefs, notifyErrorText })}
          onBorder={(notifyErrorBorder) => setPrefs({ ...prefs, notifyErrorBorder })}
        />
        <div className="md:col-span-2 space-y-3">
          <p className="text-xs text-muted">Static preview (updates as you pick colors):</p>
          <div className="flex flex-wrap gap-2">
            <div className="toast-info rounded-[var(--ui-radius)] border px-3 py-2 text-sm font-medium shadow-md backdrop-blur-md">
              Info toast sample
            </div>
            <div className="toast-success rounded-[var(--ui-radius)] border px-3 py-2 text-sm font-medium shadow-md backdrop-blur-md">
              Success toast sample
            </div>
            <div className="toast-error rounded-[var(--ui-radius)] border px-3 py-2 text-sm font-medium shadow-md backdrop-blur-md">
              Error toast sample
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => toast("Info notification preview", "info")}>
              Preview info toast
            </Button>
            <Button variant="ghost" size="sm" onClick={() => toast("Success notification preview", "success")}>
              Preview success toast
            </Button>
            <Button variant="ghost" size="sm" onClick={() => toast("Error notification preview", "error")}>
              Preview error toast
            </Button>
          </div>
        </div>

        <div className="md:col-span-2 border-t border-ui pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-faint">Gradient theme</p>
        </div>
        <FieldRow label="Gradient style">
          <Select
            value={prefs.gradientPreset}
            onChange={(e) =>
              setPrefs((p) => applyGradientPreset(p, e.target.value as GradientPreset))
            }
          >
            <option value="none">Solid (no gradient)</option>
            <option value="brand">Primary → Accent</option>
            <option value="sunset">Sunset</option>
            <option value="ocean">Ocean</option>
            <option value="violet">Violet dusk</option>
            <option value="custom">Custom gradient</option>
          </Select>
        </FieldRow>
        <FieldRow
          label="Apply gradient to"
          hint={gradientOn ? undefined : "Pick a gradient style above first"}
        >
          <Select
            value={prefs.gradientScope}
            disabled={!gradientOn}
            onChange={(e) =>
              setPrefs((p) => ({ ...p, gradientScope: e.target.value as GradientScope }))
            }
          >
            <option value="page">Page background only</option>
            <option value="brand">Buttons & nav only</option>
            <option value="both">Page + buttons & nav</option>
          </Select>
        </FieldRow>
        {prefs.gradientPreset === "custom" && (
          <>
            <ColorField
              label="Gradient start"
              value={prefs.gradientFrom}
              onChange={(gradientFrom) => setPrefs((p) => ({ ...p, gradientFrom }))}
            />
            <ColorField
              label="Gradient end"
              value={prefs.gradientTo}
              onChange={(gradientTo) => setPrefs((p) => ({ ...p, gradientTo }))}
            />
          </>
        )}
        <FieldRow label="Gradient angle (°)" hint={gradientOn ? undefined : "Enable a gradient style first"}>
          <Input
            type="number"
            min={0}
            max={360}
            value={prefs.gradientAngle}
            disabled={!gradientOn}
            onChange={(e) => setPrefs((p) => ({ ...p, gradientAngle: Number(e.target.value) }))}
          />
        </FieldRow>
        <FieldRow label="Border radius (px)">
          <Input
            type="number"
            min={4}
            max={24}
            value={prefs.borderRadius}
            onChange={(e) => setPrefs({ ...prefs, borderRadius: Number(e.target.value) })}
          />
        </FieldRow>
      </div>

      <div className="border-t border-ui p-5">
        <details className="mb-4 rounded-lg border border-ui bg-ui-elevated px-4 py-3 text-xs text-muted">
          <summary className="cursor-pointer font-medium text-soft">How theme CSS classes work</summary>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              <code className="font-mono">bg-brand</code> + <code className="font-mono">text-on-brand</code> — primary
              buttons & active nav (button color + label text settings)
            </li>
            <li>
              <code className="font-mono">bg-ui-surface</code> — cards/panels (Cards & panels color)
            </li>
            <li>
              <code className="font-mono">text-ui</code> / <code className="font-mono">text-muted</code> — body & secondary
              text (Body text setting)
            </li>
            <li>
              <code className="font-mono">text-brand</code> / <code className="font-mono">text-accent</code> — links &
              highlights
            </li>
            <li>
              <code className="font-mono">toast-info</code> / <code className="font-mono">toast-success</code> /{" "}
              <code className="font-mono">toast-error</code> — popup notifications (Popup notifications colors)
            </li>
          </ul>
          <p className="mt-2">
            Variables live on <code className="font-mono">&lt;html&gt;</code> (e.g.{" "}
            <code className="font-mono">--ui-button-text</code>). Settings auto-save to Postgres.
          </p>
        </details>
        <p className="mb-1 text-xs text-faint">
          Preview ({previewMode} mode{gradientOn ? ", gradient on" : ""})
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
          <p className="mt-1 text-sm opacity-80">
            Page uses your {previewMode} background
            {gradientOn ? " with gradient wash" : ""}.
          </p>
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
              title="Gradient strip"
            />
          )}
        </div>
      </div>
    </Card>
  );
}
