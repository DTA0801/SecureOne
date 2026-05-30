import type { AppSettingsExposure } from "@/lib/api/app-exposure";

/** Used when auth-server has no app-exposure API yet (restart required for V10+). */
export const DEFAULT_APP_SETTINGS_EXPOSURE: AppSettingsExposure = {
  notifications: true,
  email: true,
  "auth-methods": true,
  "password-policy": true,
  "feature-flags": true,
  appearance: false,
  "user-directory": true,
};

export function resolveAppSettingsExposure(
  raw: AppSettingsExposure | null | undefined,
): AppSettingsExposure {
  if (!raw || Object.keys(raw).length === 0) {
    return { ...DEFAULT_APP_SETTINGS_EXPOSURE };
  }
  return { ...DEFAULT_APP_SETTINGS_EXPOSURE, ...raw };
}
