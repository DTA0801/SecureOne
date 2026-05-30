import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { ApplicationSettingsEditor } from "@/components/applications/ApplicationSettingsEditor";
import { resolveApplicationMeta } from "@/lib/api/app-workspace";

export const dynamic = "force-dynamic";

export default async function AppSettingsPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  const app = await resolveApplicationMeta(applicationId);
  if (!app) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        breadcrumb={<Link href={`/app/${applicationId}/settings`} className="hover:underline">Settings</Link>}
        title="Settings"
        description={`${app.name} · overrides platform defaults`}
      />
      <ApplicationSettingsEditor appId={applicationId} />
    </div>
  );
}
