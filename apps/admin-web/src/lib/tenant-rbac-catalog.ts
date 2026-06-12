/** Seeded tenant RBAC catalog roles — hidden from the custom roles list (console roles cover operators). */
export const SEEDED_TENANT_RBAC_ROLE_NAMES = new Set([
  "Tenant Administrator",
  "Application Operator",
  "Tenant Auditor",
]);

export function isUserDefinedTenantRole(role: { name: string; systemRole: boolean }): boolean {
  if (role.systemRole) return false;
  return !SEEDED_TENANT_RBAC_ROLE_NAMES.has(role.name.trim());
}
