import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ClientDetailPanel } from "@/components/applications/ClientDetailPanel";
import { IsolateApplicationButton } from "@/components/applications/IsolateApplicationButton";
import { OAuthClientFormModal } from "@/components/forms/OAuthClientFormModal";
import { listApplications } from "@/lib/api/applications";
import { getOAuthClient } from "@/lib/api/oauth-clients";
import { requirePlatformAccess } from "@/lib/platform-access";
import { statusTone } from "@/lib/status";

export default async function ApplicationClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePlatformAccess();
  const { id } = await params;

  const [client, applications] = await Promise.all([getOAuthClient(id), listApplications()]);
  if (!client) notFound();
  const application = applications.find((a) => a.id === client.applicationId);

  return (
    <div className="w-full min-w-0">
      <PageHeader
        breadcrumb={<Link href="/applications" className="hover:underline">OAuth clients</Link>}
        title={client.clientId}
        description={`OAuth client for ${client.applicationName}`}
        actions={
          <>
            {application && <IsolateApplicationButton application={application} />}
            <Link href={`/app/${client.applicationId}/users`}>
              <Button variant="secondary">Application console →</Button>
            </Link>
            <Badge tone={statusTone(client.status)} dot className="capitalize">
              {client.status}
            </Badge>
            <OAuthClientFormModal
              client={client}
              applications={application ? [application] : applications}
              triggerLabel="Edit client"
              triggerVariant="secondary"
            />
          </>
        }
      />

      <ClientDetailPanel client={client} applicationName={application?.name ?? client.applicationName} />
    </div>
  );
}
