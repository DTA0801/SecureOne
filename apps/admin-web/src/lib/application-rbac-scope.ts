/** Mirrored console operator roles — managed via tenant/platform console, not application RBAC. */
export const CONSOLE_OPERATOR_ROLE_NAMES = new Set([
  "Tenant Admin",
  "Application Admin",
  "Super Admin",
]);

export const TENANT_ADMIN_ROLE_NAME = "Tenant Admin";

/** SecureOne Admin console permission keys — not part of the OAuth application product RBAC. */
export const ADMIN_CONSOLE_PERMISSION_KEYS = new Set([
  "role:read",
  "role:write",
  "app:read",
  "app:write",
  "audit:read",
  "logs:read",
  "settings:write",
  "session:read",
]);

export function isApplicationScopedRoleName(name: string): boolean {
  return !CONSOLE_OPERATOR_ROLE_NAMES.has(name);
}

export function isTenantAdminOperatorRoleName(name: string): boolean {
  return name === TENANT_ADMIN_ROLE_NAME;
}

/** Product RBAC roles plus the system Tenant Admin operator role shown in application Roles. */
export function isListedInApplicationRoleCatalogName(name: string): boolean {
  return isApplicationScopedRoleName(name) || isTenantAdminOperatorRoleName(name);
}

export function isApplicationScopedPermissionKey(key: string): boolean {
  return !ADMIN_CONSOLE_PERMISSION_KEYS.has(key);
}
