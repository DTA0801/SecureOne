import "server-only";

import { notFound } from "next/navigation";
import { apiFetch } from "./server-client";
import { normalizeTenantWorkspaceUser, type TenantWorkspace } from "./tenant-workspace";

function normalizeWorkspace(workspace: TenantWorkspace): TenantWorkspace {
  return {
    ...workspace,
    users: (workspace.users ?? []).map((u) => normalizeTenantWorkspaceUser(u)),
    applications: workspace.applications ?? [],
    consoleAccess: workspace.consoleAccess ?? [],
  };
}

/** Platform super-admin: full tenant workspace. */
export async function fetchTenantWorkspace(tenantId: string): Promise<TenantWorkspace> {
  const workspace = await apiFetch<TenantWorkspace>(
    `/api/admin/v1/tenant-workspace?tenantId=${encodeURIComponent(tenantId)}`,
  );
  return normalizeWorkspace(workspace);
}

/** Tenant operator / tenant super-admin: scoped to signed-in tenant. */
export async function fetchOperatorTenantWorkspace(): Promise<TenantWorkspace> {
  const workspace = await apiFetch<TenantWorkspace>("/api/admin/v1/tenant-workspace");
  return normalizeWorkspace(workspace);
}

export async function fetchGovernanceTenantWorkspace(
  tenantId: string,
  operatorMode: boolean,
): Promise<TenantWorkspace> {
  const workspace = operatorMode
    ? await fetchOperatorTenantWorkspace()
    : await fetchTenantWorkspace(tenantId);
  if (workspace.tenantId !== tenantId) {
    notFound();
  }
  return workspace;
}
