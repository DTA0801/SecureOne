import {
  fetchApplicationPolicySources,
  setApplicationPolicySource,
  type SettingsExposureKey,
} from "@/lib/api/application-policy";

/** Application settings always edit this app's overrides (no platform read-only mode). */
export async function ensureApplicationPolicyScope(
  applicationId: string,
  exposureKey: SettingsExposureKey,
): Promise<void> {
  const sources = await fetchApplicationPolicySources(applicationId);
  if (sources[exposureKey] !== "application") {
    await setApplicationPolicySource(applicationId, exposureKey, "application");
  }
}

export async function ensureApplicationPolicyScopes(
  applicationId: string,
  exposureKeys: SettingsExposureKey[],
): Promise<void> {
  await Promise.all(exposureKeys.map((key) => ensureApplicationPolicyScope(applicationId, key)));
}
