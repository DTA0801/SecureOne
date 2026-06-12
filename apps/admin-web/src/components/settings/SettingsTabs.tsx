"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { ApplicationAppearanceSettings } from "@/components/settings/ApplicationAppearanceSettings";
import { AppExposureSettings } from "@/components/settings/AppExposureSettings";
import { AuthenticationSettingsPanel } from "@/components/settings/AuthenticationSettingsPanel";
import { NotificationsSettings } from "@/components/settings/NotificationsSettings";
import { PlatformNotificationsSettings } from "@/components/settings/PlatformNotificationsSettings";
import { ApplicationIntegrationSettings } from "@/components/settings/ApplicationIntegrationSettings";
import { PublicManifestSettings } from "@/components/settings/PublicManifestSettings";
import { SettingsScopeBanner } from "@/components/settings/SettingsScopeBanner";
import { TokenPolicySettings } from "@/components/settings/TokenPolicySettings";
import { UserDirectorySettings } from "@/components/settings/UserDirectorySettings";
import { loadApplicationExposureAction } from "@/lib/actions/app-exposure";
import {
  fetchApplicationMfaTabState,
  fetchApplicationTokenTabState,
} from "@/lib/api/application-settings";
import type { AppSettingsExposure } from "@/lib/api/app-exposure";
import { cn } from "@/lib/cn";
import {
  getCachedApplicationExposure,
  loadApplicationExposureDeduped,
} from "@/lib/application-exposure-cache";
import { coerceAppSettingsExposure } from "@/lib/settings-exposure";

export type SettingsTabId =
  | "integration"
  | "notifications"
  | "appearance"
  | "auth"
  | "password"
  | "mfa"
  | "flags"
  | "users"
  | "public-api"
  | "tokens"
  | "apps";

type Tab = SettingsTabId;

export type SettingsScope =
  | { mode: "platform" }
  | { mode: "application"; applicationId: string };

const TAB_META: {
  id: Tab;
  label: string;
  exposureKeys: string[] | null;
}[] = [
  { id: "integration", label: "Integration", exposureKeys: null },
  { id: "notifications", label: "Notifications", exposureKeys: ["notifications", "email"] },
  { id: "appearance", label: "Appearance", exposureKeys: ["appearance"] },
  { id: "auth", label: "Authentication", exposureKeys: ["auth-methods"] },
  { id: "mfa", label: "MFA", exposureKeys: ["auth-methods"] },
  { id: "password", label: "Password policy", exposureKeys: ["password-policy"] },
  { id: "flags", label: "Feature flags", exposureKeys: ["feature-flags"] },
  { id: "users", label: "User directory", exposureKeys: ["user-directory"] },
  { id: "public-api", label: "Public API", exposureKeys: ["public-manifest"] },
  { id: "tokens", label: "OAuth tokens", exposureKeys: ["token-policy"] },
  { id: "apps", label: "For applications", exposureKeys: null },
];

/** Configured per app under Platform → For applications; not shown on platform settings. */
const APPLICATION_ONLY_TABS: Tab[] = ["integration", "users", "public-api", "tokens"];

function isTabVisible(
  tab: Tab,
  scope: SettingsScope,
  exposure: AppSettingsExposure,
  exposureReady: boolean,
  exposureError: string | undefined,
  tokenTabEnabled: boolean,
  mfaTabEnabled: boolean,
): boolean {
  if (tab === "apps") return scope.mode === "platform";
  if (tab === "integration") return scope.mode === "application";
  if (scope.mode === "platform") return !APPLICATION_ONLY_TABS.includes(tab);
  if (!exposureReady || exposureError) return false;
  const meta = TAB_META.find((t) => t.id === tab);
  if (!meta?.exposureKeys?.length) return true;
  const platformAllows = meta.exposureKeys.some((key) => Boolean(exposure[key]));
  if (tab === "tokens") {
    return platformAllows && tokenTabEnabled;
  }
  if (tab === "mfa") {
    return platformAllows && mfaTabEnabled;
  }
  return platformAllows;
}

export function SettingsTabs({
  scope,
  initialTab,
}: {
  scope: SettingsScope;
  initialTab?: SettingsTabId;
}) {
  const scopeMode = scope.mode;
  const scopedApplicationId = scope.mode === "application" ? scope.applicationId : undefined;

  const [tab, setTab] = useState<Tab>(initialTab ?? "notifications");
  const [exposure, setExposure] = useState<AppSettingsExposure>({});
  const [exposureReady, setExposureReady] = useState(scopeMode === "platform");
  const [exposureError, setExposureError] = useState<string | undefined>();
  const [tokenTabEnabled, setTokenTabEnabled] = useState(false);
  const [mfaTabEnabled, setMfaTabEnabled] = useState(false);
  const [tokenGateReady, setTokenGateReady] = useState(scopeMode === "platform");
  const [mfaGateReady, setMfaGateReady] = useState(scopeMode === "platform");

  const platformExposesTokens = Boolean(exposure["token-policy"]);
  const loadedExposureAppRef = useRef<string | null>(null);

  useEffect(() => {
    if (scopeMode !== "application" || !scopedApplicationId) {
      loadedExposureAppRef.current = null;
      setExposureReady(true);
      setTokenGateReady(true);
      setMfaGateReady(true);
      return;
    }

    const cached = getCachedApplicationExposure(scopedApplicationId);
    if (cached) {
      setExposure(cached.exposure);
      setExposureError(cached.error);
      setExposureReady(true);
      setMfaTabEnabled(cached.mfaTabEnabled);
      setTokenTabEnabled(cached.tokenTabEnabled);
      setMfaGateReady(true);
      setTokenGateReady(true);
      loadedExposureAppRef.current = scopedApplicationId;
      return;
    }

    const switchingApp = loadedExposureAppRef.current !== scopedApplicationId;
    if (switchingApp) {
      setExposureReady(false);
      setTokenGateReady(false);
      setMfaGateReady(false);
      setExposureError(undefined);
    }

    let cancelled = false;

    loadApplicationExposureDeduped(scopedApplicationId, async () => {
      const { exposure: raw, error } = await loadApplicationExposureAction(scopedApplicationId);
      const exp = coerceAppSettingsExposure(raw);

      let mfaTabEnabled = false;
      let tokenTabEnabled = false;

      const authExposed = Boolean(exp["auth-methods"]);
      if (authExposed) {
        try {
          const mfaState = await fetchApplicationMfaTabState(scopedApplicationId);
          mfaTabEnabled = mfaState.tabEnabled;
        } catch {
          mfaTabEnabled = false;
        }
      }

      if (exp["token-policy"]) {
        try {
          const tokenState = await fetchApplicationTokenTabState(scopedApplicationId);
          tokenTabEnabled = tokenState.tabEnabled;
        } catch {
          tokenTabEnabled = false;
        }
      }

      return {
        exposure: exp,
        error,
        mfaTabEnabled,
        tokenTabEnabled,
      };
    })
      .then((bundle) => {
        if (cancelled) return;
        setExposure(bundle.exposure);
        setExposureError(bundle.error);
        setExposureReady(true);
        setMfaTabEnabled(bundle.mfaTabEnabled);
        setMfaGateReady(true);
        setTokenTabEnabled(bundle.tokenTabEnabled);
        setTokenGateReady(true);
        loadedExposureAppRef.current = scopedApplicationId;
      })
      .catch(() => {
        if (cancelled) return;
        setExposureError("Failed to load enabled settings.");
        setExposureReady(true);
        setMfaGateReady(true);
        setTokenGateReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [scopeMode, scopedApplicationId]);

  const visibleTabs = useMemo(
    () =>
      TAB_META.filter((t) =>
        isTabVisible(
          t.id,
          scopeMode === "application"
            ? { mode: "application", applicationId: scopedApplicationId! }
            : { mode: "platform" },
          exposure,
          exposureReady,
          exposureError,
          tokenTabEnabled,
          mfaTabEnabled,
        ),
      ),
    [scopeMode, scopedApplicationId, exposure, exposureReady, exposureError, tokenTabEnabled, mfaTabEnabled],
  );

  useEffect(() => {
    if (scopeMode === "application" && !exposureReady) return;
    if (!visibleTabs.some((t) => t.id === tab)) {
      setTab(visibleTabs[0]?.id ?? "notifications");
    }
  }, [visibleTabs, tab, scopeMode, exposureReady]);

  const applicationId = scopedApplicationId;
  const authTab = tab === "auth" || tab === "mfa" || tab === "password" || tab === "flags";

  if (scopeMode === "application" && exposureReady && visibleTabs.length === 0) {
    return (
      <>
        <SettingsScopeBanner scope={scope} />
        <p className="rounded-lg border border-ui bg-surface px-4 py-6 text-sm text-muted">
          {exposureError ? (
            exposureError
          ) : (
            <>
              No setting sections are enabled for applications. A platform super admin can enable them under{" "}
              <strong>Platform settings → For applications</strong>.
            </>
          )}
        </p>
      </>
    );
  }

  return (
    <div>
      <SettingsScopeBanner scope={scope} />
      {scopeMode === "application" && exposureError && (
        <p className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-ui">
          {exposureError}
        </p>
      )}
      {!exposureReady && scopeMode === "application" && (
        <p className="mb-4 text-sm text-muted">Loading enabled settings…</p>
      )}

      {scopeMode === "application" && exposureReady && Boolean(exposure["auth-methods"]) && !mfaGateReady && (
        <p className="mb-4 text-sm text-muted">Loading MFA settings…</p>
      )}
      {scopeMode === "application" && exposureReady && platformExposesTokens && !tokenGateReady && (
        <p className="mb-4 text-sm text-muted">Loading OAuth token settings…</p>
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

      {tab === "integration" && applicationId && (
        <ApplicationIntegrationSettings applicationId={applicationId} onOpenTab={setTab} />
      )}
      {tab === "notifications" && scopeMode === "platform" && <PlatformNotificationsSettings />}
      {tab === "notifications" && applicationId && (
        <NotificationsSettings
          key={applicationId}
          applicationId={applicationId}
          settingsReady={exposureReady}
        />
      )}
      {exposureReady && tab === "appearance" && applicationId && (
        <ApplicationAppearanceSettings applicationId={applicationId} />
      )}
      {exposureReady && tab === "appearance" && !applicationId && <AppearanceSettings />}
      {exposureReady && tab === "users" && applicationId && (
        <UserDirectorySettings applicationId={applicationId} />
      )}
      {exposureReady && tab === "public-api" && applicationId && (
        <PublicManifestSettings applicationId={applicationId} />
      )}
      {exposureReady && tab === "tokens" && tokenTabEnabled && (
        <TokenPolicySettings applicationId={applicationId} />
      )}
      {tab === "apps" && scopeMode === "platform" && <AppExposureSettings />}
      {exposureReady && authTab && (tab !== "mfa" || scopeMode === "platform" || mfaTabEnabled) && (
        <AuthenticationSettingsPanel
          applicationId={applicationId}
          tab={tab === "mfa" ? "mfa" : tab === "password" ? "password" : tab === "flags" ? "flags" : "auth"}
          platformExposesAuthMethods={
            scopeMode === "application" && Boolean(exposure["auth-methods"])
          }
          mfaTabEnabled={scopeMode === "platform" ? true : mfaTabEnabled}
          onMfaTabEnabledChange={(enabled) => {
            setMfaTabEnabled(enabled);
            if (enabled) setTab("mfa");
          }}
          platformExposesOAuthTokens={
            scopeMode === "application" && Boolean(exposure["token-policy"])
          }
          oauthTokensTabEnabled={tokenTabEnabled}
          onOAuthTokensTabEnabledChange={(enabled) => {
            setTokenTabEnabled(enabled);
            if (enabled) setTab("tokens");
          }}
        />
      )}
    </div>
  );
}
