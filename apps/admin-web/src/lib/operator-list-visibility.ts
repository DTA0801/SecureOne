import type { AdminConsoleRoleType, ConsoleAccessAssignment } from "@/lib/api/admin-console-access";
import type { OperatorTier } from "@/lib/api/context";

export type OperatorListViewer = {
  platformSuperAdmin: boolean;
  operatorTier: OperatorTier;
  userId: string | null;
};

const TENANT_LEVEL_ROLES = new Set<AdminConsoleRoleType>([
  "TENANT_ADMIN",
  "TENANT_SUPER_ADMIN",
]);

export function userConsoleRoleTypes(
  userId: string,
  assignments: ConsoleAccessAssignment[],
): AdminConsoleRoleType[] {
  return assignments.filter((a) => a.userId === userId).map((a) => a.roleType);
}

export function hasTenantLevelConsoleRole(roleTypes: AdminConsoleRoleType[]): boolean {
  return roleTypes.some((role) => TENANT_LEVEL_ROLES.has(role));
}

/**
 * Platform super-admin — all users.
 * Tenant admin — everyone except self (other tenant admins remain visible).
 * Application admin — hide self and tenant-level console operators.
 */
export function canViewUserInOperatorList(
  viewer: OperatorListViewer,
  targetUserId: string,
  targetConsoleRoleTypes: AdminConsoleRoleType[] = [],
): boolean {
  if (viewer.platformSuperAdmin) return true;
  if (viewer.userId && targetUserId === viewer.userId) return false;
  if (viewer.operatorTier === "tenant" || viewer.operatorTier === "tenant_super") {
    return true;
  }
  if (viewer.operatorTier === "application") {
    return !hasTenantLevelConsoleRole(targetConsoleRoleTypes);
  }
  return true;
}

export function filterUsersForOperatorList<T extends { id: string }>(
  users: T[],
  viewer: OperatorListViewer,
  consoleAssignments: ConsoleAccessAssignment[] = [],
): T[] {
  return users.filter((user) =>
    canViewUserInOperatorList(
      viewer,
      user.id,
      userConsoleRoleTypes(user.id, consoleAssignments),
    ),
  );
}

export function operatorListViewerFromContext(ctx: {
  platformSuperAdmin: boolean;
  operatorTier: OperatorTier;
  userId: string | null;
}): OperatorListViewer {
  return {
    platformSuperAdmin: ctx.platformSuperAdmin,
    operatorTier: ctx.operatorTier,
    userId: ctx.userId,
  };
}
