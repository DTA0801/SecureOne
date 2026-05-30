import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsTabs } from "./SettingsTabs";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Settings"
        description="Configure authentication methods, security policies, notifications, and feature rollout for the platform."
      />
      <SettingsTabs />
    </div>
  );
}
