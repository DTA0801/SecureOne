import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TenantFormModal } from "@/components/forms/TenantFormModal";
import { tenantDeleteAction } from "@/lib/actions";
import { listUsers } from "@/lib/api/users";
import { getTenant } from "@/lib/api/tenants";
import { listApplications } from "@/lib/api/applications";
import { formatDate } from "@/lib/format";
import { planTone, statusTone } from "@/lib/status";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await getTenant(id);
  if (!tenant) notFound();

  const apps = await listApplications(tenant.id);
  const users = await listUsers(tenant.id);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        breadcrumb={<Link href="/tenants" className="hover:underline">Tenants</Link>}
        title={tenant.name}
        description={`@${tenant.slug} · created ${formatDate(tenant.createdAt)}`}
        actions={
          <>
            <Badge tone={planTone(tenant.plan)} className="capitalize">{tenant.plan}</Badge>
            <Badge tone={statusTone(tenant.status)} dot className="capitalize">{tenant.status}</Badge>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card padded={false}>
          <CardHeader title="Applications" description={`${apps.length} registered`} action={<ButtonLink href="/applications" variant="ghost" size="sm">All</ButtonLink>} />
          <Table>
            <THead>
              <tr><TH>Name</TH><TH>Type</TH><TH>Status</TH></tr>
            </THead>
            <TBody>
              {apps.map((a) => (
                <TR key={a.id}>
                  <TD>
                    <Link href={`/applications/${a.id}`} className="link-brand">{a.name}</Link>
                    <p className="font-mono text-xs text-black/45 dark:text-white/45">{a.clientId}</p>
                  </TD>
                  <TD><Badge tone="neutral" className="uppercase">{a.type}</Badge></TD>
                  <TD><Badge tone={statusTone(a.status)} dot className="capitalize">{a.status}</Badge></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>

        <Card padded={false}>
          <CardHeader title="Recent users" description={`${users.length} shown`} action={<ButtonLink href="/users" variant="ghost" size="sm">All</ButtonLink>} />
          <Table>
            <THead>
              <tr><TH>User</TH><TH>Status</TH><TH>MFA</TH></tr>
            </THead>
            <TBody>
              {users.map((u) => (
                <TR key={u.id}>
                  <TD>
                    <Link href={`/users/${u.id}`} className="link-brand">{u.firstName} {u.lastName}</Link>
                    <p className="text-xs text-black/45 dark:text-white/45">{u.email}</p>
                  </TD>
                  <TD><Badge tone={statusTone(u.status)} dot className="capitalize">{u.status}</Badge></TD>
                  <TD>{u.mfaFactors.length > 0 ? <Badge tone="success">{u.mfaFactors.length} factor{u.mfaFactors.length > 1 ? "s" : ""}</Badge> : <Badge tone="warning">none</Badge>}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
