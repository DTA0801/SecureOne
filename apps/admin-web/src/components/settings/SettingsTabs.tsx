"use client";

import { useEffect, useMemo, useState } from "react";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { AppExposureSettings } from "@/components/settings/AppExposureSettings";
import { AuthenticationSettingsPanel } from "@/components/settings/AuthenticationSettingsPanel";
import { NotificationsSettings } from "@/components/settings/NotificationsSettings";
import { UserDirectorySettings } from "@/components/settings/UserDirectorySettings";
import { loadApplicationExposureAction } from "@/lib/actions/app-exposure";
import type { AppSettingsExposure } from "@/lib/api/app-exposure";
import { cn } from "@/lib/cn";
import { resolveAppSettingsExposure } from "@/lib/settings-exposure";

type Tab = "notifications" | "appearance" | "auth" | "password" | "mfa" | "flags" | "users" | "apps";

export type SettingsScope =
  | { mode: "platform" }
  | { mode: "application"; applicationId: string };

const TAB_META: { id: Tab; label: string; exposureKey: string | null }[] = [
  { id: "notifications", label: "Notifications", exposureKey: "notifications" },
  { id: "appearance", label: "Appearance", exposureKey: "appearance" },
  { id: "auth", label: "Authentication", exposureKey: "auth-methods" },
  { id: "mfa", label: "MFA", exposureKey: "auth-methods" },
  { id: "password", label: "Password policy", exposureKey: "password-policy" },
  { id: "flags", label: "Feature flags", exposureKey: "feature-flags" },
  { id: "users", label: "User directory", exposureKey: "user-directory" },
  { id: "apps", label: "For applications", exposureKey: null },
];

function isTabVisible(
  tab: Tab,
  scope: SettingsScope,
  exposure: AppSettingsExposure | null,
  exposureReady: boolean,
): boolean {
  if (tab === "apps") return scope.mode === "platform";
  if (scope.mode === "platform") return true;
  if (!exposureReady) return true;
  const meta = TAB_META.find((t) => t.id === tab);
  if (!meta?.exposureKey) return true;
  const resolved = resolveAppSettingsExposure(exposure);
  return Boolean(resolved[meta.exposureKey]);
}

export function SettingsTabs({ scope }: { scope: SettingsScope }) {
  const [tab, setTab] = useState<Tab>("notifications");
  const [exposure, setExposure] = useState<AppSettingsExposure | null>(null);
  const [exposureReady, setExposureReady] = useState(scope.mode === "platform");

  useEffect(() => {
    if (scope.mode === "application") {
      loadApplicationExposureAction(scope.applicationId).then(({ exposure: raw }) => {
        setExposure(raw);
        setExposureReady(true);
      });
    }
  }, [scope]);

  const visibleTabs = useMemo(
    () => TAB_META.filter((t) => isTabVisible(t.id, scope, exposure, exposureReady)),
    [scope, exposure, exposureReady],
  );

  useEffect(() => {
    if (!visibleTabs.some((t) => t.id === tab)) {
      setTab(visibleTabs[0]?.id ?? "notifications");
    }
  }, [visibleTabs, tab]);

  const applicationId = scope.mode === "application" ? scope.applicationId : undefined;
  const authTab = tab === "auth" || tab === "mfa" || tab === "password" || tab === "flags";

  if (scope.mode === "application" && exposureReady && visibleTabs.length === 0) {
    return (
      <p className="rounded-lg border border-ui bg-surface px-4 py-6 text-sm text-muted">
        No setting sections are enabled for applications. A platform super admin can enable them under{" "}
        <strong>Platform settings → For applications</strong>.
      </p>
    );
  }

  return (
    <div>
      {scope.mode === "application" && (
        <p className="mb-4 text-sm text-muted">
          Values inherit from platform defaults until you change them here. Only sections enabled in{" "}
          platform settings are shown.
        </p>
      )}
      {!exposureReady && scope.mode === "application" && (
        <p className="mb-4 text-sm text-muted">Loading settings…</p>
      )}
      <div className="mb-6 flex flex-wrap gap-1 border-b border-ui">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "border-ui-primary text-brand"
                : "border-transparent text-muted hover:text-ui",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "notifications" && <NotificationsSettings applicationId={applicationId} />}
      {tab === "appearance" && <AppearanceSettings />}
      {tab === "users" && applicationId && <UserDirectorySettings applicationId={applicationId} />}
      {tab === "apps" && scope.mode === "platform" && <AppExposureSettings />}
      {authTab && (
        <AuthenticationSettingsPanel
          applicationId={applicationId}
          tab={tab === "mfa" ? "mfa" : tab === "password" ? "password" : tab === "flags" ? "flags" : "auth"}
        />
      )}
    </div>
  );
}
