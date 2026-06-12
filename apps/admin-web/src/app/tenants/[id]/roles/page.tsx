import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { TenantRolesWorkspace } from "@/components/tenant-rbac/TenantRolesWorkspace";
import { getTenant } from "@/lib/api/tenants";
import { listApplications } from "@/lib/api/applications";
import { loadTenantConsoleRolesCatalog } from "@/lib/api/tenant-console-roles";
import { listTenantPermissionsAction, listTenantRolesAction } from "@/lib/actions/tenant-rbac";
import { fetchGovernanceTenantWorkspace } from "@/lib/api/tenant-workspace-server";
import {
  assertTenantScope,
  requireTenantGovernanceAccess,
} from "@/lib/platform-access";
import { isTenantSuperAdmin } from "@/lib/operator-access";
import { applicationsFromWorkspace, tenantFromWorkspace } from "@/lib/tenant-governance";
import type { Application } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TenantRolesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireTenantGovernanceAccess();
  const tenantSuper = isTenantSuperAdmin(ctx);
  const { id } = await params;
  assertTenantScope(ctx, id);

  const workspace = await fetchGovernanceTenantWorkspace(id, tenantSuper);
  const tenant = tenantSuper
    ? tenantFromWorkspace(workspace)
    : (await getTenant(id)) ?? tenantFromWorkspace(workspace);
  if (!tenant) notFound();

  const applications: Pick<Application, "id" | "tenantId" | "name">[] = tenantSuper
    ? applicationsFromWorkspace(workspace)
    : await listApplications(tenant.id);

  const catalog = await loadTenantConsoleRolesCatalog(tenant.id);

  const [customRoles, permissions] = await Promise.all([
    listTenantRolesAction(tenant.id, true).catch(() => []),
    listTenantPermissionsAction(tenant.id).catch(() => []),
  ]);

  return (
    <div className="w-full min-w-0">
      <PageHeader
        breadcrumb={
          <>
            <Link href="/tenants/roles" className="hover:underline">
              Roles & Permissions
            </Link>
            <span className="mx-1.5 text-faint">/</span>
            <span className="text-muted">{tenant.name}</span>
          </>
        }
        title="Roles & Permissions"
        description={`Console operator roles and custom tenant governance for ${tenant.name}.`}
        actions={
          <>
            <ButtonLink href={`/tenants/${tenant.id}`} variant="ghost" size="sm">
              Tenant overview
            </ButtonLink>
            {!tenantSuper && (
              <ButtonLink href="/tenants/roles" variant="secondary" size="sm">
                Change tenant
              </ButtonLink>
            )}
          </>
        }
      />

      <TenantRolesWorkspace
        tenantId={tenant.id}
        tenantName={tenant.name}
        applications={applications as Application[]}
        consoleCatalog={catalog}
        initialCustomRoles={customRoles}
        initialPermissions={permissions}
      />
    </div>
  );
}
