import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ClientDetailPanel } from "@/components/applications/ClientDetailPanel";
import { ApplicationFormModal } from "@/components/forms/ApplicationFormModal";
import { getApplication } from "@/lib/api/applications";
import { getTenant } from "@/lib/api/tenants";
import { requirePlatformAccess } from "@/lib/platform-access";
import { statusTone } from "@/lib/status";

export default async function ApplicationClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePlatformAccess();
  const { id } = await params;

  const app = await getApplication(id);
  if (!app) notFound();
  const tenant = await getTenant(app.tenantId);
  const tenants = tenant ? [tenant] : [];

  return (
    <div className="w-full min-w-0">
      <PageHeader
        breadcrumb={<Link href="/applications" className="hover:underline">OAuth clients</Link>}
        title={app.name}
        description={app.description ?? `Client ID ${app.clientId}`}
        actions={
          <>
            <Link href={`/app/${app.id}/users`}>
              <Button variant="secondary">Application console →</Button>
            </Link>
            <Badge tone={statusTone(app.status)} dot className="capitalize">
              {app.status}
            </Badge>
            <ApplicationFormModal app={app} tenants={tenants} triggerLabel="Edit client" triggerVariant="secondary" />
          </>
        }
      />

      <ClientDetailPanel app={app} tenant={tenant} />
    </div>
  );
}
