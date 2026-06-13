import type { Role } from "@/lib/types";
import { TENANT_ADMIN_ROLE_NAME } from "@/lib/application-rbac-scope";

/** Console-operator roles are not editable as application product RBAC (except Tenant Admin is listed). */
export function isApplicationProductRole(role: Pick<Role, "name">): boolean {
  const consoleOperators = new Set(["Tenant Admin", "Application Admin", "Super Admin"]);
  return !consoleOperators.has(role.name);
}

export function isTenantAdminOperatorRole(role: Pick<Role, "name">): boolean {
  return role.name === TENANT_ADMIN_ROLE_NAME;
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
