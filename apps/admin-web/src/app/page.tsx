import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { getDiscovery, getHealth, getInfo } from "@/lib/auth-server";
import { AUTH_SERVER_URL } from "@/lib/config";
import { listTenants } from "@/lib/api/tenants";
import { listUsers } from "@/lib/api/users";
import { listAuditEvents } from "@/lib/api/audit";
import { listLoginEvents } from "@/lib/api/sessions";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [health, info, discovery] = await Promise.all([
    getHealth(),
    getInfo(),
    getDiscovery(),
  ]);
  const online = health.ok && discovery.ok;
  const [tenants, users, auditEvents, loginEvents] = await Promise.all([
    listTenants(),
    listUsers(),
    listAuditEvents(),
    listLoginEvents(),
  ]);
  const stats = {
    tenants: tenants.length,
    activeTenants: tenants.filter((t) => t.status === "active").length,
    users: users.length,
    applications: tenants.reduce((s, t) => s + t.appCount, 0),
    mfaCoverage: users.length
      ? Math.round((users.filter((u) => u.mfaFactors.length > 0).length / users.length) * 100)
      : 0,
    failedLogins24h: loginEvents.filter((l) => l.result === "failure").length,
  };
  const recentAudit = auditEvents.slice(0, 6);
  const recentLogins = loginEvents.slice(0, 5);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Dashboard"
        description="Platform-wide identity & access overview."
        actions={
          <Badge tone={online ? "success" : "danger"} dot>
            {online ? "All systems operational" : "Auth server unreachable"}
          </Badge>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Tenants" value={stats.tenants} hint={`${stats.activeTenants} active`} />
        <StatCard label="Users" value={stats.users.toLocaleString()} hint="from database" />
        <StatCard label="Applications" value={stats.applications} hint="OAuth clients" />
        <StatCard label="MFA Coverage" value={`${stats.mfaCoverage}%`} delta={{ value: "1.8%", positive: true }} hint="of users" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card padded={false}>
            <CardHeader
              title="Recent activity"
              description="Latest admin & security events"
              action={<ButtonLink href="/audit" variant="ghost" size="sm">View all</ButtonLink>}
            />
            <ul className="divide-y divide-ui">
              {recentAudit.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      <span className="font-mono text-xs text-accent">{e.action}</span>
                      <span className="mx-1.5 text-faint">·</span>
                      {e.target}
                    </p>
                    <p className="text-xs text-faint">{e.actor}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={e.result === "success" ? "success" : "danger"}>{e.result}</Badge>
                    <span className="w-16 text-right text-xs text-faint">{timeAgo(e.timestamp)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card padded={false}>
            <CardHeader
              title="Recent sign-ins"
              action={<ButtonLink href="/sessions" variant="ghost" size="sm">View all</ButtonLink>}
            />
            <ul className="divide-y divide-ui">
              {recentLogins.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{l.userEmail}</p>
                    <p className="text-xs text-faint">{l.location} · {l.device}</p>
                  </div>
                  <Badge tone={l.result === "success" ? "success" : l.result === "failure" ? "danger" : "warning"}>
                    {l.method}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card padded={false}>
            <CardHeader title="Authorization server" description={AUTH_SERVER_URL} />
            <div className="space-y-3 p-5">
              <Row label="Health" value={<Badge tone={health.ok ? "success" : "danger"} dot>{health.data?.status ?? "DOWN"}</Badge>} />
              <Row label="Version" value={<span className="font-mono text-xs">{info.data?.version ? `v${info.data.version}` : "—"}</span>} />
              <Row label="OIDC discovery" value={<Badge tone={discovery.ok ? "success" : "danger"}>{discovery.ok ? "200 OK" : "error"}</Badge>} />
              {discovery.data?.grant_types_supported && (
                <div className="pt-1">
                  <p className="mb-1.5 text-xs text-faint">Grant types</p>
                  <div className="flex flex-wrap gap-1.5">
                    {discovery.data.grant_types_supported.map((g) => (
                      <span key={g} className="rounded bg-brand-muted px-1.5 py-0.5 font-mono text-[10px] text-brand">
                        {g.replace("urn:ietf:params:oauth:grant-type:", "")}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card padded={false}>
            <CardHeader title="Tenants" action={<ButtonLink href="/tenants" variant="ghost" size="sm">Manage</ButtonLink>} />
            <ul className="divide-y divide-ui">
              {tenants.map((t) => (
                <li key={t.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-xs text-faint">{t.userCount.toLocaleString()} users</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted">{label}</span>
      {value}
    </div>
  );
}
