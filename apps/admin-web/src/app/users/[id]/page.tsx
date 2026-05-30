import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { UserFormModal } from "@/components/forms/UserFormModal";
import {
  userDeleteAction,
  userResetMfaAction,
  userSetStatusAction,
} from "@/lib/actions";
import { getUser } from "@/lib/api/users";
import { listTenants } from "@/lib/api/tenants";
import { getLoginEvents, getRole, getRoles, tenantName } from "@/lib/data";
import { formatDate, formatDateTime, initials } from "@/lib/format";
import { statusTone } from "@/lib/status";
import type { MfaFactorType } from "@/lib/types";

const MFA_LABEL: Record<MfaFactorType, string> = {
  passkey: "Passkey",
  totp: "Authenticator (TOTP)",
  sms: "SMS",
  email: "Email OTP",
  push: "Push",
};

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser(id);
  if (!user) notFound();

  const logins = getLoginEvents().filter((l) => l.userId === user.id);
  const fullName = `${user.firstName} ${user.lastName}`;
  const tenants = await listTenants();
  const roles = getRoles();
  const tenantLabel =
    tenants.find((t) => t.id === user.tenantId)?.name ?? tenantName(user.tenantId);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        breadcrumb={<Link href="/users" className="hover:underline">Users</Link>}
        title={fullName}
        description={user.email}
        actions={
          <>
            <Badge tone={statusTone(user.status)} dot className="capitalize">{user.status}</Badge>
            <UserFormModal user={user} tenants={tenants} roles={roles} triggerLabel="Edit" triggerVariant="secondary" />
            {user.status === "active" ? (
              <form action={userSetStatusAction}>
                <input type="hidden" name="id" value={user.id} />
                <input type="hidden" name="status" value="suspended" />
                <Button type="submit" variant="danger">Suspend</Button>
              </form>
            ) : (
              <form action={userSetStatusAction}>
                <input type="hidden" name="id" value={user.id} />
                <input type="hidden" name="status" value="active" />
                <Button type="submit">Reactivate</Button>
              </form>
            )}
            <ConfirmDialog
              action={userDeleteAction}
              id={user.id}
              triggerLabel="Delete"
              triggerVariant="ghost"
              title={`Delete ${fullName}?`}
              message="This permanently deletes the user account and revokes their sessions."
            />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-2xl font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
              {initials(fullName)}
            </div>
            <p className="mt-3 text-lg font-semibold">{fullName}</p>
            <p className="text-sm text-black/50 dark:text-white/50">@{user.username}</p>
            <div className="mt-3 flex gap-2">
              {user.emailVerified ? <Badge tone="success" dot>Verified</Badge> : <Badge tone="warning">Unverified</Badge>}
            </div>
          </div>
          <dl className="mt-5 space-y-3 border-t border-black/5 pt-5 text-sm dark:border-white/5">
            <Row label="Tenant" value={tenantLabel} />
            <Row label="User ID" value={<code className="font-mono text-xs">{user.id}</code>} />
            <Row label="Created" value={formatDate(user.createdAt)} />
            <Row label="Last login" value={user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Never"} />
          </dl>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card padded={false}>
            <CardHeader title="Roles" description="Assigned access via RBAC" action={<UserFormModal user={user} tenants={tenants} roles={roles} triggerLabel="Manage" triggerVariant="ghost" triggerSize="sm" />} />
            <ul className="divide-y divide-black/5 p-2 dark:divide-white/5">
              {user.roleIds.map((rid) => {
                const role = getRole(rid);
                return (
                  <li key={rid} className="flex items-center justify-between px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium">{role?.name ?? rid}</p>
                      <p className="text-xs text-black/45 dark:text-white/45">{role?.description}</p>
                    </div>
                    {role?.isComposite && <Badge tone="indigo">composite</Badge>}
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card padded={false}>
            <CardHeader
              title="Multi-factor authentication"
              description={user.mfaFactors.length > 0 ? `${user.mfaFactors.length} factor(s) enrolled` : "No factors enrolled"}
              action={
                user.mfaFactors.length > 0 ? (
                  <form action={userResetMfaAction}>
                    <input type="hidden" name="id" value={user.id} />
                    <Button type="submit" variant="ghost" size="sm">Reset MFA</Button>
                  </form>
                ) : undefined
              }
            />
            {user.mfaFactors.length > 0 ? (
              <ul className="divide-y divide-black/5 p-2 dark:divide-white/5">
                {user.mfaFactors.map((f) => (
                  <li key={f.id} className="flex items-center justify-between px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium">{MFA_LABEL[f.type]}</p>
                      <p className="text-xs text-black/45 dark:text-white/45">{f.label} · added {formatDate(f.addedAt)}</p>
                    </div>
                    {f.type === "passkey" ? <Badge tone="success">phishing-resistant</Badge> : <Badge tone={f.verified ? "success" : "warning"}>{f.verified ? "verified" : "pending"}</Badge>}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-5 text-sm text-amber-600 dark:text-amber-400">
                This user has no MFA enrolled. Consider enforcing step-up authentication.
              </div>
            )}
          </Card>

          <Card padded={false}>
            <CardHeader title="Recent sign-ins" />
            {logins.length > 0 ? (
              <ul className="divide-y divide-black/5 p-2 dark:divide-white/5">
                {logins.map((l) => (
                  <li key={l.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
                    <div>
                      <p className="font-medium">{l.location}</p>
                      <p className="text-xs text-black/45 dark:text-white/45">{l.device} · {l.ip}</p>
                    </div>
                    <div className="text-right">
                      <Badge tone={l.result === "success" ? "success" : l.result === "failure" ? "danger" : "warning"}>{l.method}</Badge>
                      <p className="mt-1 text-xs text-black/40 dark:text-white/40">{formatDateTime(l.timestamp)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-5 text-sm text-black/45 dark:text-white/45">No sign-in history.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-black/50 dark:text-white/50">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
