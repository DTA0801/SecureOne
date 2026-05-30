import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ApplicationFormModal } from "@/components/forms/ApplicationFormModal";
import { applicationDeleteAction } from "@/lib/actions";
import { getApplication } from "@/lib/api/applications";
import { getTenant } from "@/lib/api/tenants";
import { fetchAdminContext } from "@/lib/api/context";
import { formatDate } from "@/lib/format";
import { statusTone } from "@/lib/status";

export default async function ApplicationClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let ctx;
  try {
    ctx = await fetchAdminContext();
  } catch {
    ctx = { platformSuperAdmin: true, applications: [] };
  }
  if (!ctx.platformSuperAdmin) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <h1 className="text-lg font-semibold">Platform admin only</h1>
        <p className="mt-2 text-sm text-muted">
          OAuth client registration is managed by a super administrator. Use the{" "}
          <Link href="/app" className="text-brand hover:underline">
            application console
          </Link>{" "}
          for day-to-day operations.
        </p>
      </div>
    );
  }

  const app = await getApplication(id);
  if (!app) notFound();
  const tenant = await getTenant(app.tenantId);
  const tenants = tenant ? [tenant] : [];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        breadcrumb={<Link href="/applications" className="hover:underline">Manage clients</Link>}
        title={app.name}
        description={`OAuth client · ${tenant?.name ?? app.tenantId}`}
        actions={
          <>
            <Link href={`/app/${app.id}/users`}>
              <Button variant="secondary">Open application console →</Button>
            </Link>
            <Badge tone={statusTone(app.status)} dot className="capitalize">{app.status}</Badge>
            <ApplicationFormModal app={app} tenants={tenants} triggerLabel="Edit" triggerVariant="secondary" />
          </>
        }
      />

      <p className="mb-6 text-sm text-muted">
        This screen is for <strong>client credentials and OAuth configuration</strong> only. Manage users, roles,
        settings, audit, and sessions from the{" "}
        <Link href={`/app/${app.id}/users`} className="text-brand hover:underline">
          application console
        </Link>
        .
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card padded={false}>
          <CardHeader title="Credentials" />
          <div className="space-y-4 p-5">
            <Field label="Client ID" value={<code className="font-mono text-sm">{app.clientId}</code>} />
            <Field label="Client type" value={<Badge tone="indigo" className="uppercase">{app.type}</Badge>} />
          </div>
        </Card>
        <Card padded={false}>
          <CardHeader title="OAuth configuration" />
          <div className="space-y-4 p-5 text-sm">
            <Field label="Grant types" value={app.grantTypes.join(", ")} />
            <Field label="Scopes" value={app.scopes.join(", ")} />
            <Field label="Created" value={formatDate(app.createdAt)} />
          </div>
        </Card>
      </div>

      <Card className="mt-6 border-red-500/20" padded={false}>
        <CardHeader title="Danger zone" />
        <div className="flex items-center justify-between p-5">
          <p className="text-sm text-muted">Delete this OAuth client.</p>
          <ConfirmDialog
            action={applicationDeleteAction}
            id={app.id}
            triggerLabel="Delete client"
            title={`Delete ${app.name}?`}
            message="This cannot be undone."
            confirmLabel="Delete"
          />
        </div>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      {value}
    </div>
  );
}
