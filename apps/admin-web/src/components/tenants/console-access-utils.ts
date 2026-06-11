import {
  CONSOLE_ROLE_LABELS,
  type AdminConsoleRoleType,
  type ConsoleAccessAssignment,
} from "@/lib/api/admin-console-access";

export type GroupedConsoleAccess = {
  userId: string;
  email: string;
  displayName: string;
  entries: ConsoleAccessAssignment[];
};

export function groupConsoleAccessByUser(
  assignments: ConsoleAccessAssignment[],
): GroupedConsoleAccess[] {
  const byUser = new Map<string, ConsoleAccessAssignment[]>();
  for (const row of assignments) {
    const list = byUser.get(row.userId) ?? [];
    list.push(row);
    byUser.set(row.userId, list);
  }
  const result: GroupedConsoleAccess[] = [];
  for (const entries of byUser.values()) {
    const hasSuper = entries.some((e) => e.roleType === "TENANT_SUPER_ADMIN");
    const visible = hasSuper
      ? entries.filter((e) => e.roleType === "TENANT_SUPER_ADMIN")
      : entries;
    if (visible.length === 0) continue;
    result.push({
      userId: visible[0].userId,
      email: visible[0].email,
      displayName: visible[0].displayName,
      entries: [...visible].sort((a, b) => roleOrder(a.roleType) - roleOrder(b.roleType)),
    });
  }
  return result.sort((a, b) => a.email.localeCompare(b.email));
}

export function consoleRoleLabels(entries: ConsoleAccessAssignment[]): string[] {
  return [...new Set(entries.map((e) => CONSOLE_ROLE_LABELS[e.roleType]))];
}

export function consoleScopedApplicationIds(
  entries: ConsoleAccessAssignment[],
  allApplicationIds: string[],
): string[] {
  if (entries.some((e) => e.roleType === "TENANT_SUPER_ADMIN")) {
    return allApplicationIds;
  }
  return entries
    .map((e) => e.applicationId)
    .filter((id): id is string => id != null);
}

function roleOrder(role: AdminConsoleRoleType): number {
  if (role === "TENANT_SUPER_ADMIN") return 0;
  if (role === "TENANT_ADMIN") return 1;
  return 2;
}

/** RBAC roles mirrored from admin console grants — shown separately from end-user roles. */
export const ADMIN_MIRROR_RBAC_ROLES = new Set(["Tenant Admin", "Application Admin"]);
