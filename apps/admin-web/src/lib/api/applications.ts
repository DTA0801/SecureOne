import { apiFetch } from "./client";
import type { Application, AppType, Status } from "@/lib/types";

type AppDto = {
  id: string;
  tenantId: string;
  name: string;
  clientId: string;
  type: string;
  status: string;
  grantTypes: string[];
  scopes: string[];
  redirectUris: string[];
  createdAt: string;
};

function mapApp(dto: AppDto): Application {
  return {
    id: dto.id,
    tenantId: dto.tenantId,
    name: dto.name,
    clientId: dto.clientId,
    type: dto.type as AppType,
    status: dto.status as Status,
    grantTypes: dto.grantTypes,
    scopes: dto.scopes,
    redirectUris: dto.redirectUris,
    createdAt: dto.createdAt,
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

export async function createApplicationApi(input: {
  tenantId: string;
  name: string;
  clientId?: string;
  type: string;
  status: string;
  grantTypes: string[];
  scopes: string[];
  redirectUris: string[];
}): Promise<Application> {
  return mapApp(await apiFetch<AppDto>("/api/admin/v1/applications", {
    method: "POST",
    body: JSON.stringify(input),
  }));
}

export async function updateApplicationApi(
  id: string,
  input: {
    name: string;
    type: string;
    status: string;
    grantTypes: string[];
    scopes: string[];
    redirectUris: string[];
  },
): Promise<Application> {
  return mapApp(
    await apiFetch<AppDto>(`/api/admin/v1/applications/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  );
}

export async function deleteApplicationApi(id: string): Promise<void> {
  await apiFetch<void>(`/api/admin/v1/applications/${id}`, { method: "DELETE" });
}
