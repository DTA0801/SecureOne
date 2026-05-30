import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TenantFormModal } from "@/components/forms/TenantFormModal";
import { listTenants } from "@/lib/api/tenants";
import { tenantDeleteAction } from "@/lib/actions";
import { formatDate } from "@/lib/format";
import { planTone, statusTone } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function TenantsPage() {
  const tenants = await listTenants();
  const totalUsers = tenants.reduce((s, t) => s + t.userCount, 0);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Tenants"
        description="Organizations using the platform. Each tenant is isolated via PostgreSQL row-level security."
        actions={<TenantFormModal triggerLabel="+ New tenant" />}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total tenants" value={tenants.length} />
        <StatCard label="Active" value={tenants.filter((t) => t.status === "active").length} />
        <StatCard label="Total users" value={totalUsers.toLocaleString()} />
        <StatCard label="Enterprise" value={tenants.filter((t) => t.plan === "enterprise").length} />
      </div>

      <Table>
        <THead>
          <tr>
            <TH>Tenant</TH>
            <TH>Plan</TH>
            <TH>Status</TH>
            <TH className="text-right">Users</TH>
            <TH className="text-right">Apps</TH>
            <TH>Created</TH>
            <TH className="text-right">Actions</TH>
          </tr>
        </THead>
        <TBody>
          {tenants.map((t) => (
            <TR key={t.id}>
              <TD>
                <Link href={`/tenants/${t.id}`} className="group flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                    {t.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{t.name}</p>
                    <p className="font-mono text-xs text-black/45 dark:text-white/45">{t.slug}</p>
                  </div>
                </Link>
              </TD>
              <TD><Badge tone={planTone(t.plan)} className="capitalize">{t.plan}</Badge></TD>
              <TD><Badge tone={statusTone(t.status)} dot className="capitalize">{t.status}</Badge></TD>
              <TD className="text-right tabular-nums">{t.userCount.toLocaleString()}</TD>
              <TD className="text-right tabular-nums">{t.appCount}</TD>
              <TD className="text-black/55 dark:text-white/55">{formatDate(t.createdAt)}</TD>
              <TD>
                <div className="flex items-center justify-end gap-1">
                  <TenantFormModal tenant={t} triggerLabel="Edit" triggerVariant="ghost" triggerSize="sm" />
                  <ConfirmDialog
                    action={tenantDeleteAction}
                    id={t.id}
                    triggerLabel="Delete"
                    triggerVariant="ghost"
                    triggerSize="sm"
                    title={`Delete ${t.name}?`}
                    message="This removes the tenant and all associated configuration. This action cannot be undone."
                  />
                </div>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
