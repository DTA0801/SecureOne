"use client";

import { useMemo } from "react";
import { SettingsTabs, type SettingsScope } from "@/components/settings/SettingsTabs";

export function PlatformSettingsEditor() {
  const scope = useMemo<SettingsScope>(() => ({ mode: "platform" }), []);
  return <SettingsTabs scope={scope} />;
}
