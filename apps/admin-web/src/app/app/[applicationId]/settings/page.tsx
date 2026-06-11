import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
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
    <div className="w-full min-w-0">
      <PageHeader
        breadcrumb={<Link href={`/app/${applicationId}/settings`} className="hover:underline">Settings</Link>}
        title="Settings"
        description={`${app.name} · overrides platform defaults`}
      />
      <Suspense fallback={<p className="text-sm text-muted">Loading settings…</p>}>
        <ApplicationSettingsEditor appId={applicationId} />
      </Suspense>
    </div>
  );
}
