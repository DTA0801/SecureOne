import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TenantFormModal } from "@/components/forms/TenantFormModal";
import { TenantDetailPanels } from "@/components/tenants/TenantDetailPanels";
import { tenantDeleteAction } from "@/lib/actions";
import { getTenant } from "@/lib/api/tenants";
import { listApplications } from "@/lib/api/applications";
import { listRoles } from "@/lib/api/roles";
import { formatDate } from "@/lib/format";
import { planTone, statusTone } from "@/lib/status";
import { fetchTenantWorkspace } from "@/lib/api/tenant-workspace-server";
import { requirePlatformAccess } from "@/lib/platform-access";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePlatformAccess();
  const { id } = await params;
  const tenant = await getTenant(id);
  if (!tenant) notFound();

  const [apps, workspace] = await Promise.all([
    listApplications(tenant.id),
    fetchTenantWorkspace(tenant.id).catch(() => null),
  ]);

  if (!workspace) notFound();

  const defaultAppId = workspace.applications[0]?.id ?? apps[0]?.id;
  const roles = defaultAppId ? await listRoles({ applicationId: defaultAppId }) : [];

  return (
    <div className="w-full min-w-0">
      <PageHeader
        breadcrumb={<Link href="/tenants" className="hover:underline">Tenants</Link>}
        title={tenant.name}
        description={`@${tenant.slug} · created ${formatDate(tenant.createdAt)}`}
        actions={
          <>
            <Badge tone={planTone(tenant.plan)} className="capitalize">{tenant.plan}</Badge>
            <Badge tone={statusTone(tenant.status)} dot className="capitalize">{tenant.status}</Badge>
            <ButtonLink href="/applications" variant="ghost" size="sm">
              OAuth clients
            </ButtonLink>
            <TenantFormModal tenant={tenant} triggerLabel="Edit" triggerVariant="secondary" />
            <ConfirmDialog
              action={tenantDeleteAction}
              id={tenant.id}
              triggerLabel="Delete"
              triggerVariant="danger"
              title={`Delete ${tenant.name}?`}
              message="This removes the tenant and all associated configuration. This action cannot be undone."
            />
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Users" value={tenant.userCount.toLocaleString()} />
        <StatCard label="Applications" value={tenant.appCount} />
        <StatCard label="Plan" value={tenant.plan} />
        <StatCard label="Status" value={tenant.status} />
      </div>

      <TenantDetailPanels
        initialWorkspace={workspace}
        tenant={tenant}
        roles={roles}
        applications={apps}
      />
    </div>
  );
}
