import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { RoleFormModal } from "@/components/forms/RoleFormModal";
import { roleDeleteAction } from "@/lib/actions";
import { listRoles } from "@/lib/api/roles";
import { listTenants } from "@/lib/api/tenants";
import { listApplications } from "@/lib/api/applications";
import { getPermissions } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const [roles, tenants, applications] = await Promise.all([
    listRoles(),
    listTenants(),
    listApplications(),
  ]);
  const permissions = getPermissions();
  const defaultTenantId = tenants[0]?.id ?? "";
  const defaultAppId = applications.find((a) => a.tenantId === defaultTenantId)?.id ?? applications[0]?.id ?? "";
  const roleLabel = (id: string) => roles.find((r) => r.id === id)?.name ?? id;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Roles & Permissions"
        description="Role-based access control with composite (hierarchical) roles. Roles bundle permissions; composite roles inherit child roles."
        actions={
          <RoleFormModal
            roles={roles}
            tenants={tenants}
            applications={applications}
            tenantId={defaultTenantId}
            applicationId={defaultAppId}
            triggerLabel="+ New role"
          />
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Roles" value={roles.length} />
        <StatCard label="Composite" value={roles.filter((r) => r.isComposite).length} />
        <StatCard label="Permissions" value={permissions.length} />
        <StatCard label="Assignments" value={roles.reduce((s, r) => s + r.userCount, 0).toLocaleString()} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id} padded={false}>
            <div className="flex items-start justify-between gap-2 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{role.name}</h3>
                  {role.isComposite && <Badge tone="indigo">composite</Badge>}
                </div>
                <p className="mt-0.5 text-xs text-muted">{role.description}</p>
              </div>
              <Badge tone="neutral">{role.userCount.toLocaleString()} users</Badge>
            </div>
            <div className="border-t border-black/5 p-4 dark:border-white/5">
              {role.isComposite ? (
                <>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-faint">Inherits roles</p>
                  <div className="flex flex-wrap gap-1.5">
                    {role.childRoleIds.map((c) => (
                      <Badge key={c} tone="info">{roleLabel(c)}</Badge>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-faint">
                  Direct permissions can be assigned in a future release.
                </p>
              )}
            </div>
            <div className="flex items-center justify-end gap-1 border-t border-black/5 px-4 py-2.5 dark:border-white/5">
              <RoleFormModal
                role={role}
                roles={roles}
                tenants={tenants}
                applications={applications}
                tenantId={role.tenantId}
                applicationId={applications.find((a) => a.tenantId === role.tenantId)?.id ?? defaultAppId}
                triggerLabel="Edit"
                triggerVariant="ghost"
                triggerSize="sm"
              />
              <ConfirmDialog
                action={roleDeleteAction}
                id={role.id}
                triggerLabel="Delete"
                triggerVariant="ghost"
                triggerSize="sm"
                title={`Delete ${role.name}?`}
                message="Users with only this role will lose the associated access."
              />
            </div>
          </Card>
        ))}
      </div>

      <Card padded={false}>
        <CardHeader title="Permission catalog" description="All permissions available to assign to roles" />
        <Table>
          <THead>
            <tr>
              <TH>Permission</TH>
              <TH>Resource</TH>
              <TH>Action</TH>
              <TH>Description</TH>
            </tr>
          </THead>
          <TBody>
            {permissions.map((p) => (
              <TR key={p.id}>
                <TD><code className="font-mono text-xs text-accent">{p.key}</code></TD>
                <TD className="capitalize">{p.resource}</TD>
                <TD><Badge tone="neutral" className="capitalize">{p.action}</Badge></TD>
                <TD className="text-muted">{p.description}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
