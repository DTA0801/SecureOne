import { browserApiFetch as apiFetch } from "./browser-client";

export type ConsoleFeatureOverride = {
  featureKey: string;
  effect: "GRANT" | "DENY";
};

export type UserConsoleCapabilities = {
  userId: string;
  tenantId: string;
  effectiveFeatures: string[];
  roleDefaults: string[];
  overrides: ConsoleFeatureOverride[];
};

export type ConsoleCapabilityCatalog = {
  features: string[];
  roleDefaults: Record<string, string[]>;
};

export const CONSOLE_FEATURE_LABELS: Record<string, string> = {
  users: "Users",
  roles: "Roles",
  permissions: "Permissions",
  settings: "Settings",
  audit: "Audit log",
  logs: "Application logs",
  sessions: "Sessions",
};

/** Mirrors AdminConsoleCapabilityCatalog on the server (for roster display). */
export const CONSOLE_ROLE_DEFAULT_FEATURES: Record<string, string[]> = {
  APPLICATION_ADMIN: ["users", "roles", "settings", "audit", "sessions"],
  TENANT_ADMIN: ["users", "roles", "permissions", "settings", "audit", "logs", "sessions"],
  TENANT_SUPER_ADMIN: Object.keys(CONSOLE_FEATURE_LABELS),
};

export async function fetchConsoleCapabilityCatalog(
  tenantId: string,
  userId: string,
): Promise<ConsoleCapabilityCatalog> {
  return apiFetch<ConsoleCapabilityCatalog>(
    `/api/admin/v1/tenants/${tenantId}/users/${userId}/console-capabilities/catalog`,
  );
}

export async function fetchUserConsoleCapabilities(
  tenantId: string,
  userId: string,
): Promise<UserConsoleCapabilities> {
  return apiFetch<UserConsoleCapabilities>(
    `/api/admin/v1/tenants/${tenantId}/users/${userId}/console-capabilities`,
  );
}

export async function updateUserConsoleCapabilities(
  tenantId: string,
  userId: string,
  overrides: ConsoleFeatureOverride[],
): Promise<UserConsoleCapabilities> {
  return apiFetch<UserConsoleCapabilities>(
    `/api/admin/v1/tenants/${tenantId}/users/${userId}/console-capabilities`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ overrides }),
    },
  );
}
