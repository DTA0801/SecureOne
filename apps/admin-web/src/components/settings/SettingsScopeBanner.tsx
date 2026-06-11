"use client";

import type { SettingsScope } from "@/components/settings/SettingsTabs";

export function SettingsScopeBanner({ scope }: { scope: SettingsScope }) {
  if (scope.mode === "platform") {
    return (
      <div className="mb-6 rounded-lg border border-ui bg-surface px-4 py-3 text-sm text-muted">
        <strong className="text-ui">Platform settings</strong> apply to the whole tenant. SMTP, email
        templates, and the email test console are configured per application under{" "}
        <strong>Application → Settings → Notifications</strong>. Use <strong>For applications</strong> to
        choose which sections each app may override.
      </div>
    );
  }
  return (
    <div className="mb-6 rounded-lg border border-ui bg-surface px-4 py-3 text-sm text-muted">
      <strong className="text-ui">Application settings</strong> configure overrides for this app only.
      Sections appear here when enabled under <strong>Platform → For applications</strong>.
    </div>
  );
}
