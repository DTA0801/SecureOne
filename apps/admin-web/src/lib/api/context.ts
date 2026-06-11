import { apiFetch } from "./server-client";

export type OperatorTier = "platform" | "tenant_super" | "tenant" | "application";

export type ApplicationContextItem = {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  name: string;
  slug: string;
  status: string;
  permissions: string[];
  /** Admin console sections this operator may access for this application. */
  consoleFeatures: string[];
};

export type AdminContext = {
  /** True only for the platform operator account without SECUREONE_ACT_AS_EMAIL. */
  platformSuperAdmin: boolean;
  operatorTier: OperatorTier;
  principal: string;
  email: string | null;
  displayName: string;
  tenantId: string | null;
  tenantSlug: string | null;
  tenantName: string | null;
  userId: string | null;
  actAsEmail: string | null;
  applications: ApplicationContextItem[];
};

export async function fetchAdminContext(): Promise<AdminContext> {
  const raw = await apiFetch<{
    platformSuperAdmin: boolean;
    operatorTier?: OperatorTier;
    principal: string;
    email?: string | null;
    displayName?: string;
    tenantId?: string | null;
    tenantSlug?: string | null;
    tenantName?: string | null;
    userId?: string | null;
    actAsEmail: string | null;
    applications: ApplicationContextItem[];
  }>("/api/admin/v1/context");
  return {
    platformSuperAdmin: raw.platformSuperAdmin,
    operatorTier: raw.operatorTier ?? (raw.platformSuperAdmin ? "platform" : "application"),
    principal: raw.principal,
    email: raw.email ?? null,
    displayName: raw.displayName ?? raw.principal,
    tenantId: raw.tenantId ?? null,
    tenantSlug: raw.tenantSlug ?? null,
    tenantName: raw.tenantName ?? null,
    userId: raw.userId ?? null,
    actAsEmail: raw.actAsEmail,
    applications: raw.applications.map((app) => ({
      ...app,
      permissions: app.permissions ?? [],
      consoleFeatures: app.consoleFeatures ?? [],
    })),
  };
}
