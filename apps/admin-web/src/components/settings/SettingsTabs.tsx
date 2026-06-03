"use client";

import { useEffect, useMemo, useState } from "react";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { ApplicationAppearanceSettings } from "@/components/settings/ApplicationAppearanceSettings";
import { AppExposureSettings } from "@/components/settings/AppExposureSettings";
import { AuthenticationSettingsPanel } from "@/components/settings/AuthenticationSettingsPanel";
import { NotificationsSettings } from "@/components/settings/NotificationsSettings";
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
import { coerceAppSettingsExposure } from "@/lib/settings-exposure";

type Tab =
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

export type SettingsScope =
  | { mode: "platform" }
  | { mode: "application"; applicationId: string };

const TAB_META: {
  id: Tab;
  label: string;
  exposureKeys: string[] | null;
}[] = [
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
const APPLICATION_ONLY_TABS: Tab[] = ["users", "public-api", "tokens"];

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

export function SettingsTabs({ scope }: { scope: SettingsScope }) {
  const [tab, setTab] = useState<Tab>("notifications");
  const [exposure, setExposure] = useState<AppSettingsExposure>({});
  const [exposureReady, setExposureReady] = useState(scope.mode === "platform");
  const [exposureError, setExposureError] = useState<string | undefined>();
  const [tokenTabEnabled, setTokenTabEnabled] = useState(false);
  const [mfaTabEnabled, setMfaTabEnabled] = useState(false);
  const [tokenGateReady, setTokenGateReady] = useState(scope.mode === "platform");
  const [mfaGateReady, setMfaGateReady] = useState(scope.mode === "platform");

  const platformExposesTokens = Boolean(exposure["token-policy"]);

  useEffect(() => {
    if (scope.mode === "application") {
      setExposureReady(false);
      setTokenGateReady(false);
      setMfaGateReady(false);
      setExposureError(undefined);
      loadApplicationExposureAction(scope.applicationId).then(async ({ exposure: raw, error }) => {
        const exp = coerceAppSettingsExposure(raw);
        setExposure(exp);
        setExposureError(error);
        setExposureReady(true);

        const authExposed = Boolean(exp["auth-methods"]);
        if (!authExposed) {
          setMfaTabEnabled(false);
          setMfaGateReady(true);
        } else {
          try {
            const mfaState = await fetchApplicationMfaTabState(scope.applicationId);
            setMfaTabEnabled(mfaState.tabEnabled);
          } catch {
            setMfaTabEnabled(false);
          } finally {
            setMfaGateReady(true);
          }
        }

        if (!exp["token-policy"]) {
          setTokenTabEnabled(false);
          setTokenGateReady(true);
          return;
        }
        try {
          const tokenState = await fetchApplicationTokenTabState(scope.applicationId);
          setTokenTabEnabled(tokenState.tabEnabled);
        } catch {
          setTokenTabEnabled(false);
        } finally {
          setTokenGateReady(true);
        }
      });
    }
  }, [scope]);

  const visibleTabs = useMemo(
    () =>
      TAB_META.filter((t) =>
        isTabVisible(t.id, scope, exposure, exposureReady, exposureError, tokenTabEnabled, mfaTabEnabled),
      ),
    [scope, exposure, exposureReady, exposureError, tokenTabEnabled, mfaTabEnabled],
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
      {scope.mode === "application" && exposureError && (
        <p className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-ui">
          {exposureError}
        </p>
      )}
      {!exposureReady && scope.mode === "application" && (
        <p className="mb-4 text-sm text-muted">Loading enabled settings…</p>
      )}

      {scope.mode === "application" && exposureReady && Boolean(exposure["auth-methods"]) && !mfaGateReady && (
        <p className="mb-4 text-sm text-muted">Loading MFA settings…</p>
      )}
      {scope.mode === "application" && exposureReady && platformExposesTokens && !tokenGateReady && (
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

      {exposureReady && tab === "notifications" && (
        <NotificationsSettings applicationId={applicationId} />
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
      {tab === "apps" && scope.mode === "platform" && <AppExposureSettings />}
      {exposureReady && authTab && (tab !== "mfa" || scope.mode === "platform" || mfaTabEnabled) && (
        <AuthenticationSettingsPanel
          applicationId={applicationId}
          tab={tab === "mfa" ? "mfa" : tab === "password" ? "password" : tab === "flags" ? "flags" : "auth"}
          platformExposesAuthMethods={
            scope.mode === "application" && Boolean(exposure["auth-methods"])
          }
          mfaTabEnabled={scope.mode === "platform" ? true : mfaTabEnabled}
          onMfaTabEnabledChange={(enabled) => {
            setMfaTabEnabled(enabled);
            if (enabled) setTab("mfa");
          }}
          platformExposesOAuthTokens={
            scope.mode === "application" && Boolean(exposure["token-policy"])
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
