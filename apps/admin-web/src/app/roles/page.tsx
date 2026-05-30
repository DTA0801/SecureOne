import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { getPermission, getPermissions, getRoles, roleName } from "@/lib/data";

export default function RolesPage() {
  const roles = getRoles();
  const permissions = getPermissions();

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Roles & Permissions"
        description="Role-based access control with composite (hierarchical) roles. Roles bundle permissions; composite roles inherit child roles."
        actions={<Button>+ New role</Button>}
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
                <p className="mt-0.5 text-xs text-black/50 dark:text-white/50">{role.description}</p>
              </div>
              <Badge tone="neutral">{role.userCount.toLocaleString()} users</Badge>
            </div>
            <div className="border-t border-black/5 p-4 dark:border-white/5">
              {role.isComposite ? (
                <>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-black/45 dark:text-white/45">Inherits roles</p>
                  <div className="flex flex-wrap gap-1.5">
                    {role.childRoleIds.map((c) => (
                      <Badge key={c} tone="info">{roleName(c)}</Badge>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-black/45 dark:text-white/45">
                    Permissions ({role.permissionIds.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissionIds.map((pid) => (
                      <span key={pid} className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[10px] dark:bg-white/10">
                        {getPermission(pid)?.key ?? pid}
                      </span>
                    ))}
                  </div>
                </>
              )}
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
                <TD><code className="font-mono text-xs text-indigo-600 dark:text-indigo-400">{p.key}</code></TD>
                <TD className="capitalize">{p.resource}</TD>
                <TD><Badge tone="neutral" className="capitalize">{p.action}</Badge></TD>
                <TD className="text-black/55 dark:text-white/55">{p.description}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
