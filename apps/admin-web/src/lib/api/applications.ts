import { apiFetch } from "./client";
import { AUTH_SERVER_URL } from "@/lib/config";
import type { Application, AppType, OAuthEndpoints, Status } from "@/lib/types";

const DEFAULT_ENDPOINTS: OAuthEndpoints = {
  issuer: AUTH_SERVER_URL,
  authorizationEndpoint: `${AUTH_SERVER_URL}/oauth2/authorize`,
  tokenEndpoint: `${AUTH_SERVER_URL}/oauth2/token`,
  jwksUri: `${AUTH_SERVER_URL}/oauth2/jwks`,
};

type AppDto = {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  clientId: string;
  type: string;
  status: string;
  grantTypes: string[];
  scopes: string[];
  redirectUris: string[];
  postLogoutRedirectUris?: string[];
  confidential: boolean;
  pkceRequired: boolean;
  tokenEndpointAuthMethod: string;
  clientSecretConfigured: boolean;
  createdAt: string;
  updatedAt: string;
  oAuthEndpoints: OAuthEndpoints;
};

function mapApp(dto: AppDto & Partial<Application>): Application {
  const type = dto.type as AppType;
  return {
    id: dto.id,
    tenantId: dto.tenantId,
    name: dto.name,
    description: dto.description,
    clientId: dto.clientId,
    type,
    status: dto.status as Status,
    grantTypes: dto.grantTypes ?? [],
    scopes: dto.scopes ?? [],
    redirectUris: dto.redirectUris ?? [],
    postLogoutRedirectUris: dto.postLogoutRedirectUris ?? [],
    confidential: dto.confidential ?? (type === "web" || type === "m2m"),
    pkceRequired: dto.pkceRequired ?? type !== "m2m",
    tokenEndpointAuthMethod:
      dto.tokenEndpointAuthMethod ?? (type === "web" || type === "m2m" ? "client_secret_basic" : "none"),
    clientSecretConfigured: dto.clientSecretConfigured ?? false,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt ?? dto.createdAt,
    oAuthEndpoints: dto.oAuthEndpoints ?? DEFAULT_ENDPOINTS,
  };
}

export async function listApplications(tenantId?: string): Promise<Application[]> {
  const path = tenantId
    ? `/api/admin/v1/applications?tenantId=${tenantId}`
    : "/api/admin/v1/applications";
  return (await apiFetch<AppDto[]>(path)).map(mapApp);
}

export async function getApplication(id: string): Promise<Application | null> {
  try {
    return mapApp(await apiFetch<AppDto>(`/api/admin/v1/applications/${id}`));
  } catch (e) {
    if (e instanceof Error && "status" in e && (e as { status: number }).status === 404) return null;
    throw e;
  }
}

export type ApplicationWriteInput = {
  name: string;
  description?: string;
  clientId?: string;
  type: string;
  status: string;
  grantTypes: string[];
  scopes: string[];
  redirectUris: string[];
  postLogoutRedirectUris?: string[];
  pkceRequired?: boolean;
  tokenEndpointAuthMethod?: string;
};

export async function createApplicationApi(
  input: ApplicationWriteInput & { tenantId: string },
): Promise<{ application: Application; clientSecret?: string }> {
  const res = await apiFetch<{ application: AppDto; clientSecret?: string | null }>(
    "/api/admin/v1/applications",
    { method: "POST", body: JSON.stringify(input) },
  );
  return {
    application: mapApp(res.application),
    clientSecret: res.clientSecret ?? undefined,
  };
}

export async function updateApplicationApi(
  id: string,
  input: ApplicationWriteInput,
): Promise<Application> {
  return mapApp(
    await apiFetch<AppDto>(`/api/admin/v1/applications/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  );
}

export async function rotateApplicationSecretApi(id: string): Promise<string> {
  const res = await apiFetch<{ clientSecret: string }>(
    `/api/admin/v1/applications/${id}/rotate-secret`,
    { method: "POST" },
  );
  return res.clientSecret;
}

export async function deleteApplicationApi(id: string): Promise<void> {
  await apiFetch<void>(`/api/admin/v1/applications/${id}`, { method: "DELETE" });
}
