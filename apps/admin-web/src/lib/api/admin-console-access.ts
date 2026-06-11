import { browserApiFetch as apiFetch } from "./browser-client";

export type AdminConsoleRoleType =
  | "APPLICATION_ADMIN"
  | "TENANT_ADMIN"
  | "TENANT_SUPER_ADMIN";

export type ConsoleAccessAssignment = {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  roleType: AdminConsoleRoleType;
  tenantId: string;
  applicationId: string | null;
  applicationName: string | null;
};

export const CONSOLE_ROLE_LABELS: Record<AdminConsoleRoleType, string> = {
  APPLICATION_ADMIN: "Application Admin",
  TENANT_ADMIN: "Tenant Admin",
  TENANT_SUPER_ADMIN: "Tenant Super Admin",
};

export async function listConsoleAccess(tenantId: string): Promise<ConsoleAccessAssignment[]> {
  return apiFetch<ConsoleAccessAssignment[]>(
    `/api/admin/v1/tenants/${tenantId}/console-access`,
  );
}

export async function grantConsoleAccess(
  tenantId: string,
  body: { userId: string; roleType: AdminConsoleRoleType; applicationId?: string },
): Promise<ConsoleAccessAssignment> {
  return apiFetch<ConsoleAccessAssignment>(
    `/api/admin/v1/tenants/${tenantId}/console-access`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export async function revokeConsoleAccess(
  tenantId: string,
  assignmentId: string,
): Promise<void> {
  await apiFetch<void>(`/api/admin/v1/tenants/${tenantId}/console-access/${assignmentId}`, {
    method: "DELETE",
  });
}
