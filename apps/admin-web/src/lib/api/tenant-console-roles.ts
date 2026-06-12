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
    assignmentCount: assignments.filter((a) => a.roleType === roleType).length,
  }));
  return { features, roles };
}

/** Load tenant console role catalog using the same auth path as other tenant pages. */
export async function loadTenantConsoleRolesCatalog(
  tenantId: string,
): Promise<TenantConsoleRolesCatalog> {
  const assignments = await listConsoleAccess(tenantId);
  return buildTenantConsoleRolesCatalog(assignments);
}

/** Tenant super-admin: use console assignments from operator workspace payload. */
export function loadTenantConsoleRolesCatalogFromAssignments(
  assignments: ConsoleAccessAssignment[],
): TenantConsoleRolesCatalog {
  return buildTenantConsoleRolesCatalog(assignments);
}
