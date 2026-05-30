import { getDiscovery, getHealth, getInfo } from "@/lib/auth-server";
import { AUTH_SERVER_URL } from "@/lib/config";

export const dynamic = "force-dynamic";

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        ok
          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : "bg-red-500/15 text-red-600 dark:text-red-400"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`} />
      {label}
    </span>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
      <h2 className="mb-3 text-sm font-semibold text-black/60 dark:text-white/60">{title}</h2>
      {children}
    </section>
  );
}

export default async function DashboardPage() {
  const [health, info, discovery] = await Promise.all([
    getHealth(),
    getInfo(),
    getDiscovery(),
  ]);

  const online = health.ok && discovery.ok;

  const endpoints = discovery.data
    ? ([
        ["Issuer", discovery.data.issuer],
        ["Authorization", discovery.data.authorization_endpoint],
        ["Token", discovery.data.token_endpoint],
        ["JWKS", discovery.data.jwks_uri],
        ["UserInfo", discovery.data.userinfo_endpoint],
        ["Introspection", discovery.data.introspection_endpoint],
        ["Revocation", discovery.data.revocation_endpoint],
        ["End Session", discovery.data.end_session_endpoint],
      ] as const).filter(([, v]) => Boolean(v))
    : [];

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-black/50 dark:text-white/50">
            Authorization server: <code className="font-mono">{AUTH_SERVER_URL}</code>
          </p>
        </div>
        <StatusBadge ok={online} label={online ? "Operational" : "Unreachable"} />
      </header>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card title="Health">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">
              {health.data?.status ?? "—"}
            </span>
            <StatusBadge ok={health.ok} label={health.ok ? "UP" : "DOWN"} />
          </div>
        </Card>
        <Card title="Auth Server">
          <p className="text-lg font-semibold">{info.data?.name ?? "—"}</p>
          <p className="text-xs text-black/50 dark:text-white/50">
            {info.data?.version ? `v${info.data.version}` : info.error ?? ""}
          </p>
        </Card>
        <Card title="OIDC Discovery">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">
              {discovery.ok ? "Available" : "—"}
            </span>
            <StatusBadge ok={discovery.ok} label={discovery.ok ? "200" : "ERR"} />
          </div>
        </Card>
      </div>

      {!online && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
          Could not reach the authorization server. Start it with{" "}
          <code className="font-mono">./gradlew bootRun</code> in{" "}
          <code className="font-mono">apps/auth-server</code> and ensure Postgres
          + Redis are up (<code className="font-mono">docker compose -f deploy/docker-compose.yml up -d</code>).
        </div>
      )}

      {endpoints.length > 0 && (
        <Card title="OIDC Endpoints">
          <dl className="divide-y divide-black/5 dark:divide-white/5">
            {endpoints.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 py-2">
                <dt className="text-sm text-black/60 dark:text-white/60">{label}</dt>
                <dd className="truncate font-mono text-xs text-black/80 dark:text-white/80">
                  {value as string}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {discovery.data?.grant_types_supported && (
        <div className="mt-6 flex flex-wrap gap-2">
          {discovery.data.grant_types_supported.map((g) => (
            <span
              key={g}
              className="rounded-md bg-indigo-500/10 px-2 py-1 font-mono text-xs text-indigo-600 dark:text-indigo-400"
            >
              {g}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
