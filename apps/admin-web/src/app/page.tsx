import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { getDiscovery, getHealth, getInfo } from "@/lib/auth-server";
import { AUTH_SERVER_URL } from "@/lib/config";
import {
  getAuditEvents,
  getLoginEvents,
  getTenants,
  platformStats,
} from "@/lib/data";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [health, info, discovery] = await Promise.all([
    getHealth(),
    getInfo(),
    getDiscovery(),
  ]);
  const online = health.ok && discovery.ok;
  const stats = platformStats();
  const recentAudit = getAuditEvents().slice(0, 6);
  const recentLogins = getLoginEvents().slice(0, 5);
  const tenants = getTenants();

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
        <StatCard label="Users" value={stats.users.toLocaleString()} delta={{ value: "4.2%", positive: true }} hint="vs last month" />
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
            <ul className="divide-y divide-black/5 dark:divide-white/5">
              {recentAudit.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400">{e.action}</span>
                      <span className="mx-1.5 text-black/30 dark:text-white/30">·</span>
                      {e.target}
                    </p>
                    <p className="text-xs text-black/45 dark:text-white/45">{e.actor}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={e.result === "success" ? "success" : "danger"}>{e.result}</Badge>
                    <span className="w-16 text-right text-xs text-black/40 dark:text-white/40">{timeAgo(e.timestamp)}</span>
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
            <ul className="divide-y divide-black/5 dark:divide-white/5">
              {recentLogins.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{l.userEmail}</p>
                    <p className="text-xs text-black/45 dark:text-white/45">{l.location} · {l.device}</p>
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
                  <p className="mb-1.5 text-xs text-black/45 dark:text-white/45">Grant types</p>
                  <div className="flex flex-wrap gap-1.5">
                    {discovery.data.grant_types_supported.map((g) => (
                      <span key={g} className="rounded bg-indigo-500/10 px-1.5 py-0.5 font-mono text-[10px] text-indigo-600 dark:text-indigo-400">
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
            <ul className="divide-y divide-black/5 dark:divide-white/5">
              {tenants.map((t) => (
                <li key={t.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-xs text-black/45 dark:text-white/45">{t.userCount.toLocaleString()} users</span>
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
      <span className="text-sm text-black/55 dark:text-white/55">{label}</span>
      {value}
    </div>
  );
}
