import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { UserFormModal } from "@/components/forms/UserFormModal";
import { listUsers } from "@/lib/api/users";
import { listTenants } from "@/lib/api/tenants";
import { getRoles, roleName } from "@/lib/data";
import { initials, timeAgo } from "@/lib/format";
import { statusTone } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const [users, tenants] = await Promise.all([listUsers(), listTenants()]);
  const roles = getRoles();
  const tenantMap = new Map(tenants.map((t) => [t.id, t.name]));

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Users"
        description="Accounts across all tenants, with credentials, roles, and MFA enrollment."
        actions={<UserFormModal tenants={tenants} roles={roles} triggerLabel="+ Invite user" />}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total users" value={users.length} />
        <StatCard label="Active" value={users.filter((u) => u.status === "active").length} />
        <StatCard label="With MFA" value={users.filter((u) => u.mfaFactors.length > 0).length} />
        <StatCard label="Unverified" value={users.filter((u) => !u.emailVerified).length} />
      </div>

      <Table>
        <THead>
          <tr>
            <TH>User</TH>
            <TH>Tenant</TH>
            <TH>Roles</TH>
            <TH>MFA</TH>
            <TH>Status</TH>
            <TH>Last login</TH>
          </tr>
        </THead>
        <TBody>
          {users.map((u) => (
            <TR key={u.id}>
              <TD>
                <Link href={`/users/${u.id}`} className="group flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                    {initials(`${u.firstName} ${u.lastName}`)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{u.firstName} {u.lastName}</p>
                    <p className="truncate text-xs text-black/45 dark:text-white/45">{u.email}</p>
                  </div>
                </Link>
              </TD>
              <TD className="text-black/55 dark:text-white/55">{tenantMap.get(u.tenantId) ?? u.tenantId}</TD>
              <TD>
                <div className="flex flex-wrap gap-1">
                  {u.roleIds.map((r) => (
                    <Badge key={r} tone="neutral">{roleName(r)}</Badge>
                  ))}
                </div>
              </TD>
              <TD>{u.mfaFactors.length > 0 ? <Badge tone="success" dot>{u.mfaFactors.length}</Badge> : <Badge tone="warning">none</Badge>}</TD>
              <TD><Badge tone={statusTone(u.status)} dot className="capitalize">{u.status}</Badge></TD>
              <TD className="text-black/55 dark:text-white/55">{timeAgo(u.lastLoginAt)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
