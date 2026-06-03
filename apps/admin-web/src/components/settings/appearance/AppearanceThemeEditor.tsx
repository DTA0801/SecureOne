"use client";

import { Button } from "@/components/ui/Button";
import { FieldRow, Input, Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import {
  applyGradientPreset,
  ColorField,
  isGradientActive,
  NotifyVariantFields,
} from "@/components/settings/appearance/appearance-shared";
import type { GradientPreset, GradientScope, UiPreferences } from "@/lib/theme/types";

export function AppearanceThemeEditor({
  prefs,
  setPrefs,
  ready,
  showNotifyPreviews = true,
}: {
  prefs: UiPreferences;
  setPrefs: (next: UiPreferences | ((prev: UiPreferences) => UiPreferences)) => void;
  ready: boolean;
  /** Platform admin console: live toast previews. Off for client appearance tab. */
  showNotifyPreviews?: boolean;
}) {
  const { toast } = useToast();
  const gradientOn = isGradientActive(prefs);

  return (
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
        <p className="mb-3 text-xs text-muted">Primary buttons, active tabs, and solid button fills.</p>
      </div>
      <ColorField
        label="Button / nav color"
        value={prefs.primaryColor}
        onChange={(primaryColor) => {
          const next = { ...prefs, primaryColor };
          if (prefs.gradientPreset === "brand") next.gradientFrom = primaryColor;
          setPrefs(next);
        }}
      />
      <ColorField
        label="Button label text"
        value={prefs.buttonTextColor}
        onChange={(buttonTextColor) => setPrefs({ ...prefs, buttonTextColor })}
      />
      <ColorField
        label="Links & accent"
        value={prefs.accentColor}
        onChange={(accentColor) => {
          const next = { ...prefs, accentColor };
          if (prefs.gradientPreset === "brand") next.gradientTo = accentColor;
          setPrefs(next);
        }}
      />

      <div className="md:col-span-2">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-faint">Light mode — page & cards</p>
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
      <ColorField label="Body text" value={prefs.textColor} onChange={(textColor) => setPrefs({ ...prefs, textColor })} />

      <div className="md:col-span-2">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-faint">Dark mode — page & cards</p>
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
        <p className="mb-3 text-xs text-muted">In-app toast / snackbar colors for client applications.</p>
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
      {showNotifyPreviews && (
        <div className="md:col-span-2 space-y-3">
          <p className="text-xs text-muted">Static preview:</p>
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
      )}

      <div className="md:col-span-2 border-t border-ui pt-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-faint">Gradient theme</p>
      </div>
      <FieldRow label="Gradient style">
        <Select
          value={prefs.gradientPreset}
          onChange={(e) => setPrefs((p) => applyGradientPreset(p, e.target.value as GradientPreset))}
        >
          <option value="none">Solid (no gradient)</option>
          <option value="brand">Primary → Accent</option>
          <option value="sunset">Sunset</option>
          <option value="ocean">Ocean</option>
          <option value="violet">Violet dusk</option>
          <option value="custom">Custom gradient</option>
        </Select>
      </FieldRow>
      <FieldRow label="Apply gradient to" hint={gradientOn ? undefined : "Pick a gradient style above first"}>
        <Select
          value={prefs.gradientScope}
          disabled={!gradientOn}
          onChange={(e) => setPrefs((p) => ({ ...p, gradientScope: e.target.value as GradientScope }))}
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
  );
}
