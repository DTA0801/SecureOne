import type { TenantWorkspace } from "@/lib/api/tenant-workspace";
import type { Application, Tenant } from "@/lib/types";

/** Build tenant summary for governance pages when platform tenant API is unavailable. */
export function tenantFromWorkspace(workspace: TenantWorkspace): Tenant {
  return {
    id: workspace.tenantId,
    name: workspace.tenantName,
    slug: workspace.tenantSlug,
    status: workspace.status as Tenant["status"],
    plan: workspace.plan as Tenant["plan"],
    userCount: workspace.userCount,
    appCount: workspace.applicationCount,
    createdAt: "",
  };
}

/** Minimal application rows for tenant role scope UI. */
export function applicationsFromWorkspace(
  workspace: TenantWorkspace,
): Pick<Application, "id" | "tenantId" | "name">[] {
  return workspace.applications.map((app) => ({
    id: app.id,
    tenantId: workspace.tenantId,
    name: app.name,
  }));
}
