import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { RolesWorkspace, RolesWorkspaceHeaderActions } from "@/components/roles/RolesWorkspace";
import { resolveApplicationMeta } from "@/lib/api/app-workspace";
import { listPermissions } from "@/lib/api/permissions";
import { listRoles, probeRolesApi } from "@/lib/api/roles";
import { listTenants } from "@/lib/api/tenants";
import { getApplication } from "@/lib/api/applications";

export const dynamic = "force-dynamic";

export default async function AppRolesPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  const appMeta = await resolveApplicationMeta(applicationId);
  if (!appMeta) notFound();

  let roles: Awaited<ReturnType<typeof listRoles>> = [];
  let permissions: Awaited<ReturnType<typeof listPermissions>> = [];
  let capabilities = { enterprise: false, permissions: false };
  try {
    [roles, permissions, capabilities] = await Promise.all([
      listRoles({ applicationId }),
      listPermissions(applicationId).catch(() => []),
      probeRolesApi(applicationId).catch(() => ({ enterprise: false, permissions: false })),
    ]);
    if (permissions.length > 0) {
      capabilities = { ...capabilities, permissions: true };
    }
  } catch {
    roles = [];
    permissions = [];
  }
  const [tenants, app] = await Promise.all([listTenants(), getApplication(applicationId)]);
  const tenant = tenants.find((t) => t.id === appMeta.tenantId);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        breadcrumb={<Link href={`/app/${applicationId}/roles`} className="hover:underline">Roles</Link>}
        title="Role management"
        description={`${appMeta.name} · enterprise RBAC with labels, hierarchy, and permissions`}
        actions={
          app && tenant ? (
            <RolesWorkspaceHeaderActions
              roles={roles}
              permissions={permissions}
              tenants={[tenant]}
              applications={[app]}
              tenantId={app.tenantId}
              applicationId={applicationId}
            />
          ) : undefined
        }
      />
      {app && tenant ? (
        <RolesWorkspace
          roles={roles}
          permissions={permissions}
          tenants={[tenant]}
          applications={[app]}
          tenantId={app.tenantId}
          applicationId={applicationId}
          appName={appMeta.name}
          capabilities={capabilities}
        />
      ) : (
        <p className="text-sm text-muted">Unable to load application context.</p>
      )}
    </div>
  );
}
