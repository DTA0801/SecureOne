"use client";

import { useState } from "react";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { AuthenticationSettingsPanel } from "@/components/settings/AuthenticationSettingsPanel";
import { NotificationsSettings } from "@/components/settings/NotificationsSettings";
import { cn } from "@/lib/cn";

type Tab = "notifications" | "appearance" | "auth" | "password" | "mfa" | "flags";

export function SettingsTabs() {
  const [tab, setTab] = useState<Tab>("notifications");

  const tabs: { id: Tab; label: string }[] = [
    { id: "notifications", label: "Notifications" },
    { id: "appearance", label: "Appearance" },
    { id: "auth", label: "Authentication" },
    { id: "mfa", label: "MFA" },
    { id: "password", label: "Password policy" },
    { id: "flags", label: "Feature flags" },
  ];

  const authTab = tab === "auth" || tab === "mfa" || tab === "password" || tab === "flags";

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-1 border-b border-ui">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "border-[var(--ui-primary)] text-brand"
                : "border-transparent text-muted hover:text-ui",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "notifications" && <NotificationsSettings />}
      {tab === "appearance" && <AppearanceSettings />}
      {authTab && (
        <AuthenticationSettingsPanel
          tab={tab === "mfa" ? "mfa" : tab === "password" ? "password" : tab === "flags" ? "flags" : "auth"}
        />
      )}
    </div>
  );
}
