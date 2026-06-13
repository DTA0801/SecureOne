import { browserApiFetch as apiFetch } from "./browser-client";
import type { ConsoleAccessAssignment } from "./admin-console-access";
import type { ConsoleFeatureOverride } from "./admin-console-capabilities";

export type TenantRosterSource =
  | "direct"
  | "imported"
  | "console_access"
  | "console_only";

export type TenantWorkspaceApplication = {
  id: string;
  name: string;
  slug: string;
  status: string;
  userCount: number;
};

export type TenantWorkspaceApplicationAccess = {
  applicationId: string;
  applicationName: string;
  roleIds: string[];
  roleNames: string[];
  permissionKeys: string[];
};

export type TenantWorkspaceUser = {
  id: string;
  email: string;
  displayName: string;
  status: string;
  emailVerified: boolean;
  applicationIds: string[];
  roleNames: string[];
  onRoster: boolean;
  rosterSource: TenantRosterSource | null;
  sourceApplicationId: string | null;
  sourceApplicationName: string | null;
  rosterAddedAt: string | null;
  rosterAddedById: string | null;
  rosterAddedByLabel: string | null;
  effectiveConsoleFeatures: string[];
  consoleFeatureOverrides: ConsoleFeatureOverride[];
  applicationAccess: TenantWorkspaceApplicationAccess[];
  tenantGovernanceRoleIds: string[];
  tenantGovernanceRoleNames: string[];
};

export type TenantWorkspace = {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  status: string;
  plan: string;
  userCount: number;
  applicationCount: number;
  applications: TenantWorkspaceApplication[];
  users: TenantWorkspaceUser[];
  consoleAccess: ConsoleAccessAssignment[];
};

function tenantQuery(tenantId?: string): string {
  return tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : "";
}

function normalizeApplicationAccess(
  row: Partial<TenantWorkspaceApplicationAccess> | null | undefined,
): TenantWorkspaceApplicationAccess | null {
  if (!row || typeof row !== "object") return null;
  return {
    applicationId: row.applicationId ?? "",
    applicationName: row.applicationName ?? "",
    roleIds: Array.isArray(row.roleIds) ? row.roleIds : [],
    roleNames: Array.isArray(row.roleNames) ? row.roleNames : [],
    permissionKeys: Array.isArray(row.permissionKeys) ? row.permissionKeys : [],
  };
}

export function normalizeTenantWorkspaceUser(
  user: Partial<TenantWorkspaceUser> & { id: string },
): TenantWorkspaceUser {
  const access = Array.isArray(user.applicationAccess) ? user.applicationAccess : [];
  return {
    id: user.id,
    email: user.email ?? "",
    displayName: user.displayName ?? "",
    status: user.status ?? "active",
    emailVerified: Boolean(user.emailVerified),
    applicationIds: Array.isArray(user.applicationIds) ? user.applicationIds : [],
    roleNames: Array.isArray(user.roleNames) ? user.roleNames : [],
    onRoster: Boolean(user.onRoster),
    rosterSource: user.rosterSource ?? null,
    sourceApplicationId: user.sourceApplicationId ?? null,
    sourceApplicationName: user.sourceApplicationName ?? null,
    rosterAddedAt: user.rosterAddedAt ?? null,
    rosterAddedById: user.rosterAddedById ?? null,
    rosterAddedByLabel: user.rosterAddedByLabel ?? null,
    effectiveConsoleFeatures: Array.isArray(user.effectiveConsoleFeatures)
      ? user.effectiveConsoleFeatures
      : [],
    consoleFeatureOverrides: Array.isArray(user.consoleFeatureOverrides)
      ? user.consoleFeatureOverrides
      : [],
    applicationAccess: access
      .map((row) => normalizeApplicationAccess(row))
      .filter((row): row is TenantWorkspaceApplicationAccess => row !== null),
    tenantGovernanceRoleIds: Array.isArray(user.tenantGovernanceRoleIds)
      ? user.tenantGovernanceRoleIds
      : [],
    tenantGovernanceRoleNames: Array.isArray(user.tenantGovernanceRoleNames)
      ? user.tenantGovernanceRoleNames
      : [],
  };
}

function normalizeTenantWorkspace(workspace: TenantWorkspace): TenantWorkspace {
  return {
    ...workspace,
    users: (workspace.users ?? []).map((u) => normalizeTenantWorkspaceUser(u)),
    applications: workspace.applications ?? [],
    consoleAccess: workspace.consoleAccess ?? [],
  };
}

export async function fetchTenantWorkspace(tenantId?: string): Promise<TenantWorkspace> {
  const workspace = await apiFetch<TenantWorkspace>(
    `/api/admin/v1/tenant-workspace${tenantQuery(tenantId)}`,
  );
  return normalizeTenantWorkspace(workspace);
}

export async function grantUserApplication(
  userId: string,
  applicationId: string,
  tenantId?: string,
): Promise<void> {
  await apiFetch<void>(
    `/api/admin/v1/tenant-workspace/users/${userId}/applications/${applicationId}${tenantQuery(tenantId)}`,
    { method: "POST" },
  );
}

export async function revokeUserApplication(
  userId: string,
  applicationId: string,
  tenantId?: string,
): Promise<void> {
  await apiFetch<void>(
    `/api/admin/v1/tenant-workspace/users/${userId}/applications/${applicationId}${tenantQuery(tenantId)}`,
    { method: "DELETE" },
  );
}

export async function fetchImportableUsers(
  applicationId: string,
  tenantId?: string,
): Promise<TenantWorkspaceUser[]> {
  const params = new URLSearchParams();
  if (tenantId) params.set("tenantId", tenantId);
  const query = params.toString();
  return apiFetch<TenantWorkspaceUser[]>(
    `/api/admin/v1/tenant-workspace/applications/${applicationId}/importable-users${query ? `?${query}` : ""}`,
  );
}

export async function importUserToTenantRoster(
  userId: string,
  applicationId: string,
  tenantId?: string,
): Promise<void> {
  const params = new URLSearchParams({ applicationId });
  if (tenantId) params.set("tenantId", tenantId);
  await apiFetch<void>(
    `/api/admin/v1/tenant-workspace/users/${userId}/roster?${params}`,
    { method: "POST" },
  );
}

export async function bulkImportUsersToTenantRoster(
  userIds: string[],
  applicationId: string,
  tenantId?: string,
): Promise<number> {
  const params = new URLSearchParams({ applicationId });
  if (tenantId) params.set("tenantId", tenantId);
  const result = await apiFetch<{ imported: number }>(
    `/api/admin/v1/tenant-workspace/users/roster/bulk?${params}`,
    { method: "POST", body: JSON.stringify({ userIds }) },
  );
  return result.imported;
}

export async function removeUserFromTenantRoster(
  userId: string,
  tenantId?: string,
): Promise<void> {
  await apiFetch<void>(
    `/api/admin/v1/tenant-workspace/users/${userId}/roster${tenantQuery(tenantId)}`,
    { method: "DELETE" },
  );
}

export async function updateUserApplicationRoles(
  userId: string,
  applicationId: string,
  tenantId: string,
  roleIds: string[],
): Promise<void> {
  const params = new URLSearchParams({ tenantId });
  await apiFetch<void>(
    `/api/admin/v1/tenant-workspace/users/${userId}/applications/${applicationId}/roles?${params}`,
    { method: "PUT", body: JSON.stringify({ roleIds }) },
  );
}

export function rosterSourceLabel(
  source: TenantRosterSource | null,
  sourceApplicationName?: string | null,
): string {
  switch (source) {
    case "direct":
      return "Added directly";
    case "imported":
      return sourceApplicationName ? `Imported from ${sourceApplicationName}` : "Imported from application";
    case "console_access":
      return "Admin console access";
    case "console_only":
      return "Console access only";
    default:
      return "Unknown";
  }
}

export function isInvitedAccount(status: string): boolean {
  const s = status.toLowerCase();
  return s === "pending" || s === "invited";
}

export function userApplicationAccess(
  user: TenantWorkspaceUser | null | undefined,
): TenantWorkspaceApplicationAccess[] {
  if (!user) return [];
  return Array.isArray(user.applicationAccess) ? user.applicationAccess : [];
}

/** Patch roster user after console capability / role saves. */
export type TenantWorkspaceUserPatch = {
  userId: string;
  effectiveConsoleFeatures?: string[];
  consoleFeatureOverrides?: ConsoleFeatureOverride[];
  applicationAccess?: TenantWorkspaceApplicationAccess[];
  roleNames?: string[];
  tenantGovernanceRoleIds?: string[];
  tenantGovernanceRoleNames?: string[];
};

export function resolveRosterConsoleFeatures(
  user: TenantWorkspaceUser,
  _consoleRoleTypes: string[],
): string[] {
  if (user.effectiveConsoleFeatures?.length) {
    return user.effectiveConsoleFeatures;
  }
  return [];
}

export function patchTenantWorkspaceUser(
  user: TenantWorkspaceUser,
  patch: TenantWorkspaceUserPatch,
): TenantWorkspaceUser {
  if (user.id !== patch.userId) return user;
  return {
    ...user,
    ...(patch.effectiveConsoleFeatures
      ? { effectiveConsoleFeatures: patch.effectiveConsoleFeatures }
      : {}),
    ...(patch.consoleFeatureOverrides
      ? { consoleFeatureOverrides: patch.consoleFeatureOverrides }
      : {}),
    ...(patch.applicationAccess ? { applicationAccess: patch.applicationAccess } : {}),
    ...(patch.roleNames ? { roleNames: patch.roleNames } : {}),
    ...(patch.tenantGovernanceRoleIds
      ? { tenantGovernanceRoleIds: patch.tenantGovernanceRoleIds }
      : {}),
    ...(patch.tenantGovernanceRoleNames
      ? { tenantGovernanceRoleNames: patch.tenantGovernanceRoleNames }
      : {}),
  };
}

export function mergeTenantWorkspace(
  incoming: TenantWorkspace,
  prior?: TenantWorkspace,
): TenantWorkspace {
  const normalized = normalizeTenantWorkspace(incoming);
  if (!prior) return normalized;
  const priorUsers = new Map(prior.users.map((u) => [u.id, u]));
  return {
    ...normalized,
    users: normalized.users.map((user) => {
      const previous = priorUsers.get(user.id);
      if (!previous) return user;
      const keepCaps =
        !user.effectiveConsoleFeatures?.length &&
        Boolean(previous.effectiveConsoleFeatures?.length);
      const keepOverrides =
        !user.consoleFeatureOverrides?.length &&
        Boolean(previous.consoleFeatureOverrides?.length);
      if (!keepCaps && !keepOverrides) return user;
      return {
        ...user,
        effectiveConsoleFeatures: keepCaps
          ? previous.effectiveConsoleFeatures
          : user.effectiveConsoleFeatures,
        consoleFeatureOverrides: keepOverrides
          ? previous.consoleFeatureOverrides
          : user.consoleFeatureOverrides,
      };
    }),
  };
}

export function userPermissionKeys(user: TenantWorkspaceUser | null | undefined): string[] {
  const keys = new Set<string>();
  for (const row of userApplicationAccess(user)) {
    for (const key of row.permissionKeys ?? []) {
      if (key) keys.add(key);
    }
  }
  return [...keys].sort();
}
