import { PageHeader } from "@/components/ui/PageHeader";
import { getAuthMethods, getFeatureFlags, getPasswordPolicy } from "@/lib/data";
import { SettingsTabs } from "./SettingsTabs";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Settings"
        description="Configure authentication methods, security policies, and feature rollout for the platform."
      />
      <SettingsTabs
        authMethods={getAuthMethods()}
        featureFlags={getFeatureFlags()}
        passwordPolicy={getPasswordPolicy()}
      />
    </div>
  );
}
