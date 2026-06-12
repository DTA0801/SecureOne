import type { TenantPermission } from "@/lib/api/tenant-rbac";

export const CONSOLE_PERMISSION_PREFIX = "console:";

export function featureToConsolePermissionKey(feature: string): string {
  return `${CONSOLE_PERMISSION_PREFIX}${feature}`;
}

export function isConsolePermissionKey(key: string): boolean {
  return key.startsWith(CONSOLE_PERMISSION_PREFIX);
}

export function consoleFeaturesFromPermissionIds(
  permissions: TenantPermission[],
  permissionIds: string[],
  allFeatures: string[],
): string[] {
  const selected = new Set(permissionIds);
  return allFeatures.filter((feature) => {
    const perm = permissions.find((p) => p.key === featureToConsolePermissionKey(feature));
    return perm ? selected.has(perm.id) : false;
  });
}

export function syncConsolePermissionIds(
  permissions: TenantPermission[],
  permissionIds: string[],
  feature: string,
  enabled: boolean,
): string[] {
  const perm = permissions.find((p) => p.key === featureToConsolePermissionKey(feature));
  if (!perm) return permissionIds;
  if (enabled) {
    return permissionIds.includes(perm.id) ? permissionIds : [...permissionIds, perm.id];
  }
  return permissionIds.filter((id) => id !== perm.id);
}
