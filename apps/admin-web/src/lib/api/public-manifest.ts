import { apiFetch, appScopeHeaders } from "./client";

export type PublicManifestSections = {
  application?: boolean;
  authMethods?: boolean;
  featureFlags?: boolean;
  passwordPolicy?: boolean;
  appearance?: boolean;
};

export type PublicManifestConfig = {
  enabled: boolean;
  sections: PublicManifestSections;
  authMethodsOnlyEnabled: boolean;
  scope?: string;
  inheritsPlatformDefaults?: boolean;
  publicEndpoint?: string;
};

const base = (appId: string) =>
  `/api/admin/v1/applications/${appId}/settings/public-manifest`;

export async function fetchPublicManifestConfig(appId: string): Promise<PublicManifestConfig> {
  return apiFetch<PublicManifestConfig>(base(appId), {
    headers: appScopeHeaders(appId),
  });
}

export async function savePublicManifestConfig(
  appId: string,
  body: PublicManifestConfig,
): Promise<PublicManifestConfig> {
  return apiFetch<PublicManifestConfig>(base(appId), {
    method: "PUT",
    headers: appScopeHeaders(appId),
    body: JSON.stringify(body),
  });
}
