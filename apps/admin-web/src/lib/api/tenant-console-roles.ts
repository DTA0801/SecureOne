import { browserApiFetch as apiFetch } from "./browser-client";
import {
  CONSOLE_ROLE_DEFAULT_FEATURES,
  CONSOLE_FEATURE_LABELS,
} from "./admin-console-capabilities";
import {
  CONSOLE_ROLE_LABELS,
  listConsoleAccess,
  type AdminConsoleRoleType,
  type ConsoleAccessAssignment,
} from "./admin-console-access";

export type { ConsoleAccessAssignment };

export type TenantConsoleRole = {
  roleType: AdminConsoleRoleType;
  name: string;
  description: string;
  applicationScoped: boolean;
  allApplications: boolean;
  defaultFeatures: string[];
  customized?: boolean;
  assignmentCount: number;
};

export type TenantConsoleRolesCatalog = {
  features: string[];
  roles: TenantConsoleRole[];
};

const ROLE_ORDER: AdminConsoleRoleType[] = [
  "APPLICATION_ADMIN",
  "TENANT_ADMIN",
  "TENANT_SUPER_ADMIN",
];

const ROLE_DESCRIPTIONS: Record<AdminConsoleRoleType, string> = {
  APPLICATION_ADMIN:
    "Manage users, roles, and settings for a single assigned OAuth application.",
  TENANT_ADMIN:
    "Manage users and console access across assigned applications within the tenant.",
  TENANT_SUPER_ADMIN:
    "Full tenant console access across all applications, including operator management.",
};

export function buildTenantConsoleRolesCatalog(
  assignments: ConsoleAccessAssignment[],
): TenantConsoleRolesCatalog {
  const features = Object.keys(CONSOLE_FEATURE_LABELS);
  const roles = ROLE_ORDER.map((roleType) => ({
    roleType,
    name: CONSOLE_ROLE_LABELS[roleType],
    description: ROLE_DESCRIPTIONS[roleType],
    applicationScoped: roleType === "APPLICATION_ADMIN",
    allApplications: roleType === "TENANT_SUPER_ADMIN",
    defaultFeatures: CONSOLE_ROLE_DEFAULT_FEATURES[roleType] ?? [],
    customized: false,
    assignmentCount: assignments.filter((a) => a.roleType === roleType).length,
  }));
  return { features, roles };
}

export async function fetchTenantConsoleRolesCatalog(
  tenantId: string,
): Promise<TenantConsoleRolesCatalog> {
  return apiFetch<TenantConsoleRolesCatalog>(
    `/api/admin/v1/tenants/${tenantId}/console-roles`,
  );
}

export async function updateConsoleRoleFeatures(
  tenantId: string,
  roleType: AdminConsoleRoleType,
  features: string[],
): Promise<string[]> {
  return apiFetch<string[]>(
    `/api/admin/v1/tenants/${tenantId}/console-roles/${roleType}/features`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features }),
    },
  );
}

/** Load catalog from API with fallback to assignment-derived defaults. */
export async function loadTenantConsoleRolesCatalog(
  tenantId: string,
): Promise<TenantConsoleRolesCatalog> {
  try {
    return await fetchTenantConsoleRolesCatalog(tenantId);
  } catch {
    const assignments = await listConsoleAccess(tenantId).catch(() => []);
    return buildTenantConsoleRolesCatalog(assignments);
  }
}

export function loadTenantConsoleRolesCatalogFromAssignments(
  assignments: ConsoleAccessAssignment[],
): TenantConsoleRolesCatalog {
  return buildTenantConsoleRolesCatalog(assignments);
}
