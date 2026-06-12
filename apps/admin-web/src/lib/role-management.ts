import type { Role } from "@/lib/types";

/** Console-operator roles are not shown in application RBAC UI. */
export function isApplicationProductRole(role: Pick<Role, "name">): boolean {
  const consoleOperators = new Set(["Tenant Admin", "Application Admin", "Super Admin"]);
  return !consoleOperators.has(role.name);
}

export function canRenameRole(role: Pick<Role, "isSystem">): boolean {
  return !role.isSystem;
}

export function canDeleteRole(role: Pick<Role, "isSystem">): boolean {
  return !role.isSystem;
}

export function canEditRoleDetails(role: Pick<Role, "name">): boolean {
  return isApplicationProductRole(role);
}

export function canEditRolePermissions(role: Pick<Role, "name">): boolean {
  return isApplicationProductRole(role);
}
