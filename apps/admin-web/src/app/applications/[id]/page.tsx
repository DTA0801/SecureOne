import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ApplicationFormModal } from "@/components/forms/ApplicationFormModal";
import { applicationDeleteAction } from "@/lib/actions";
import { getApplication, getTenants, tenantName } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { statusTone } from "@/lib/status";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const app = getApplication(id);
  if (!app) notFound();
  const tenants = getTenants();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        breadcrumb={<Link href="/applications" className="hover:underline">Applications</Link>}
        title={app.name}
        description={`${tenantName(app.tenantId)} · created ${formatDate(app.createdAt)}`}
        actions={
          <>
            <Badge tone={statusTone(app.status)} dot className="capitalize">{app.status}</Badge>
            <ApplicationFormModal app={app} tenants={tenants} triggerLabel="Edit" triggerVariant="secondary" />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card padded={false}>
          <CardHeader title="Credentials" />
          <div className="space-y-4 p-5">
            <Field label="Client ID" value={<code className="font-mono text-sm">{app.clientId}</code>} />
            <Field
              label="Client secret"
              value={
                <div className="flex items-center gap-2">
                  <code className="font-mono text-sm">••••••••••••••••</code>
                  <Button variant="ghost" size="sm">Reveal</Button>
                  <Button variant="ghost" size="sm">Rotate</Button>
                </div>
              }
            />
            <Field label="Client type" value={<Badge tone="indigo" className="uppercase">{app.type}</Badge>} />
            <Field label="Token endpoint auth" value={<span className="text-sm">{app.type === "spa" || app.type === "native" ? "none (PKCE)" : "client_secret_basic"}</span>} />
          </div>
        </Card>

        <Card padded={false}>
          <CardHeader title="OAuth configuration" />
          <div className="space-y-4 p-5">
            <Field
              label="Grant types"
              value={
                <div className="flex flex-wrap gap-1.5">
                  {app.grantTypes.map((g) => (
                    <span key={g} className="rounded bg-indigo-500/10 px-2 py-0.5 font-mono text-xs text-indigo-600 dark:text-indigo-400">{g}</span>
                  ))}
                </div>
              }
            />
            <Field
              label="Scopes"
              value={
                <div className="flex flex-wrap gap-1.5">
                  {app.scopes.map((s) => (
                    <span key={s} className="rounded bg-black/5 px-2 py-0.5 font-mono text-xs dark:bg-white/10">{s}</span>
                  ))}
                </div>
              }
            />
            <Field
              label="Redirect URIs"
              value={
                app.redirectUris.length > 0 ? (
                  <ul className="space-y-1">
                    {app.redirectUris.map((u) => (
                      <li key={u} className="font-mono text-xs text-black/70 dark:text-white/70">{u}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-sm text-black/40 dark:text-white/40">None (machine-to-machine)</span>
                )
              }
            />
          </div>
        </Card>
      </div>

      <Card className="mt-6 border-red-500/20" padded={false}>
        <CardHeader title="Danger zone" description="Irreversible and destructive actions" />
        <div className="flex items-center justify-between p-5">
          <p className="text-sm text-black/55 dark:text-white/55">Delete this client and revoke all its tokens.</p>
          <ConfirmDialog
            action={applicationDeleteAction}
            id={app.id}
            triggerLabel="Delete client"
            title={`Delete ${app.name}?`}
            message="All tokens issued to this client will be revoked. This action cannot be undone."
            confirmLabel="Delete client"
          />
        </div>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-black/45 dark:text-white/45">{label}</p>
      {value}
    </div>
  );
}
