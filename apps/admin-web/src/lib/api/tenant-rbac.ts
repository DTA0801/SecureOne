import { browserApiFetch as apiFetch } from "./browser-client";

export type TenantPermission = {
  id: string;
  tenantId: string;
  key: string;
  description: string;
};

export type TenantRole = {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  systemRole: boolean;
  userCount: number;
  permissionCount: number;
  applicationScopeCount: number;
};

export type TenantRoleDetail = TenantRole & {
  permissionIds: string[];
  applicationIds: string[];
  permissions: TenantPermission[];
};

function base(tenantId: string) {
  return `/api/admin/v1/tenants/${tenantId}/tenant-rbac`;
}

export async function listTenantPermissions(tenantId: string): Promise<TenantPermission[]> {
  return apiFetch<TenantPermission[]>(`${base(tenantId)}/permissions`);
}

export async function listTenantRoles(tenantId: string): Promise<TenantRole[]> {
  return apiFetch<TenantRole[]>(`${base(tenantId)}/roles`);
}

export async function getTenantRole(tenantId: string, roleId: string): Promise<TenantRoleDetail> {
  return apiFetch<TenantRoleDetail>(`${base(tenantId)}/roles/${roleId}`);
}

export async function createTenantRole(
  tenantId: string,
  body: {
    name: string;
    description?: string;
    permissionIds: string[];
    applicationIds: string[];
  },
): Promise<TenantRoleDetail> {
  return apiFetch<TenantRoleDetail>(`${base(tenantId)}/roles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function updateTenantRole(
  tenantId: string,
  roleId: string,
  body: {
    name: string;
    description?: string;
    permissionIds: string[];
    applicationIds: string[];
  },
): Promise<TenantRoleDetail> {
  return apiFetch<TenantRoleDetail>(`${base(tenantId)}/roles/${roleId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function deleteTenantRole(tenantId: string, roleId: string): Promise<void> {
  await apiFetch<void>(`${base(tenantId)}/roles/${roleId}`, { method: "DELETE" });
}

export async function createTenantPermission(
  tenantId: string,
  body: { key: string; description?: string },
): Promise<TenantPermission> {
  return apiFetch<TenantPermission>(`${base(tenantId)}/permissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function deleteTenantPermission(
  tenantId: string,
  permissionId: string,
): Promise<void> {
  await apiFetch<void>(`${base(tenantId)}/permissions/${permissionId}`, { method: "DELETE" });
}

/** Platform catalog keys — custom permissions use any other key. */
export const TENANT_CATALOG_PERMISSION_KEYS = new Set([
  "tenant:read",
  "tenant:manage",
  "operator:read",
  "operator:manage",
  "application:access",
  "application:manage",
  "console:users",
  "console:roles",
  "console:groups",
  "console:permissions",
  "console:settings",
  "console:audit",
  "console:logs",
  "console:sessions",
]);

export function isTenantCatalogPermission(key: string): boolean {
  return TENANT_CATALOG_PERMISSION_KEYS.has(key.trim().toLowerCase());
}
