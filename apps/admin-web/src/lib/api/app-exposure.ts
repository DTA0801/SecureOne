import { apiFetch } from "./client";

export type AppSettingsExposure = Record<string, boolean>;

export async function fetchAppExposure(): Promise<AppSettingsExposure> {
  return apiFetch<AppSettingsExposure>("/api/admin/v1/settings/app-exposure");
}

export async function saveAppExposure(body: AppSettingsExposure): Promise<AppSettingsExposure> {
  return apiFetch<AppSettingsExposure>("/api/admin/v1/settings/app-exposure", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function fetchApplicationExposure(appId: string): Promise<AppSettingsExposure> {
  const { apiFetch: fetch, appScopeHeaders } = await import("./client");
  return fetch<AppSettingsExposure>(
    `/api/admin/v1/applications/${appId}/settings/exposure`,
    { headers: appScopeHeaders(appId) },
  );
}
