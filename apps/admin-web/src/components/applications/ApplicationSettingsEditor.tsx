"use client";

import { SettingsTabs } from "@/components/settings/SettingsTabs";

export function ApplicationSettingsEditor({ appId }: { appId: string }) {
  return <SettingsTabs scope={{ mode: "application", applicationId: appId }} />;
}
