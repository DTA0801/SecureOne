import { getApplication, listApplications } from "./applications";
import { fetchAdminContext, type AdminContext, type ApplicationContextItem } from "./context";
import { getTenant, listTenants } from "./tenants";

/** Resolve application metadata for app-scoped pages (tolerates missing /context API). */
export async function resolveApplicationMeta(
  applicationId: string,
): Promise<ApplicationContextItem | null> {
  const ctx = await loadAdminContextSafe();
  const found = ctx.applications.find((a) => a.id === applicationId);
  if (found) return found;

  const app = await getApplication(applicationId);
  if (!app) return null;

  const tenant = await getTenant(app.tenantId);
  return {
    id: app.id,
    tenantId: app.tenantId,
    tenantName: tenant?.name ?? app.tenantId,
    tenantSlug: tenant?.slug ?? "",
    name: app.name,
    slug: app.clientId,
    status: app.status,
  };
}

async function applicationsFromListApi(): Promise<ApplicationContextItem[]> {
  const [apps, tenants] = await Promise.all([listApplications(), listTenants()]);
  const tenantById = new Map(tenants.map((t) => [t.id, t]));
  return apps.map((app) => {
    const tenant = tenantById.get(app.tenantId);
    return {
      id: app.id,
      tenantId: app.tenantId,
      tenantName: tenant?.name ?? app.tenantId,
      tenantSlug: tenant?.slug ?? "",
      name: app.name,
      slug: app.clientId,
      status: app.status,
    };
  });
}

export async function loadAdminContextSafe(): Promise<AdminContext> {
  try {
    const ctx = await fetchAdminContext();
    if (ctx.applications.length > 0) return ctx;
    const fallback = await applicationsFromListApi();
    return { ...ctx, applications: fallback };
  } catch {
    try {
      return {
        platformSuperAdmin: false,
        principal: "",
        actAsEmail: process.env.SECUREONE_ACT_AS_EMAIL ?? null,
        applications: await applicationsFromListApi(),
      };
    } catch {
      return {
        platformSuperAdmin: false,
        principal: "",
        actAsEmail: process.env.SECUREONE_ACT_AS_EMAIL ?? null,
        applications: [],
      };
    }
  }
}
