import "server-only";

import { apiFetch } from "./server-client";
import { normalizeTenantWorkspaceUser, type TenantWorkspace } from "./tenant-workspace";

export async function fetchTenantWorkspace(tenantId: string): Promise<TenantWorkspace> {
  const workspace = await apiFetch<TenantWorkspace>(
    `/api/admin/v1/tenant-workspace?tenantId=${encodeURIComponent(tenantId)}`,
  );
  return {
    ...workspace,
    users: (workspace.users ?? []).map((u) => normalizeTenantWorkspaceUser(u)),
    applications: workspace.applications ?? [],
    consoleAccess: workspace.consoleAccess ?? [],
  };
}
