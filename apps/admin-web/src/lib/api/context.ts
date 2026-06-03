import { apiFetch } from "./client";

export type ApplicationContextItem = {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  name: string;
  slug: string;
  status: string;
};

export type AdminContext = {
  /** True only for the platform operator account without SECUREONE_ACT_AS_EMAIL. */
  platformSuperAdmin: boolean;
  principal: string;
  actAsEmail: string | null;
  applications: ApplicationContextItem[];
};

export async function fetchAdminContext(): Promise<AdminContext> {
  const raw = await apiFetch<{
    platformSuperAdmin: boolean;
    principal: string;
    actAsEmail: string | null;
    applications: ApplicationContextItem[];
  }>("/api/admin/v1/context");
  return {
    platformSuperAdmin: raw.platformSuperAdmin,
    principal: raw.principal,
    actAsEmail: raw.actAsEmail,
    applications: raw.applications,
  };
}
