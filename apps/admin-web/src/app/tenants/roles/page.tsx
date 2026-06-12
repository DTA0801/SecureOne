import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { listTenants } from "@/lib/api/tenants";
import { redirect } from "next/navigation";
import { isTenantSuperAdmin } from "@/lib/operator-access";
import { requireTenantGovernanceAccess } from "@/lib/platform-access";
import { planTone, statusTone } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function TenantRolesIndexPage() {
  const ctx = await requireTenantGovernanceAccess();
  if (isTenantSuperAdmin(ctx) && ctx.tenantId) {
    redirect(`/tenants/${ctx.tenantId}/roles`);
  }
  const tenants = await listTenants();

  return (
    <div className="w-full min-w-0">
      <PageHeader
        breadcrumb={
          <Link href="/tenants" className="hover:underline">
            Tenant
          </Link>
        }
        title="Roles & Permissions"
        description="Select a tenant to manage governance roles, permission grants, and application scope."
      />

      <Table>
        <THead>
          <tr>
            <TH>Tenant</TH>
            <TH>Plan</TH>
            <TH>Status</TH>
            <TH className="text-right">Applications</TH>
            <TH className="text-right">Actions</TH>
          </tr>
        </THead>
        <TBody>
          {tenants.map((t) => (
            <TR key={t.id}>
              <TD>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-muted text-xs font-bold text-brand">
                    {t.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-ui">{t.name}</p>
                    <p className="font-mono text-xs text-faint">{t.slug}</p>
                  </div>
                </div>
              </TD>
              <TD>
                <Badge tone={planTone(t.plan)} className="capitalize">
                  {t.plan}
                </Badge>
              </TD>
              <TD>
                <Badge tone={statusTone(t.status)} dot className="capitalize">
                  {t.status}
                </Badge>
              </TD>
              <TD className="text-right tabular-nums">{t.appCount}</TD>
              <TD className="text-right">
                <Link
                  href={`/tenants/${t.id}/roles`}
                  className="text-sm font-medium text-brand hover:underline"
                >
                  Manage roles
                </Link>
              </TD>
            </TR>
          ))}
          {tenants.length === 0 && (
            <TR>
              <TD colSpan={5} className="py-10 text-center text-sm text-faint">
                No tenants yet. Create a tenant first from the Tenants list.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </div>
  );
}
