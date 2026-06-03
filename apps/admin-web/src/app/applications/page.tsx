import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { ClientRegistry } from "@/components/applications/ClientRegistry";
import { ApplicationFormModal } from "@/components/forms/ApplicationFormModal";
import { listApplications } from "@/lib/api/applications";
import { listTenants } from "@/lib/api/tenants";
import { requirePlatformAccess } from "@/lib/platform-access";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  await requirePlatformAccess();
  const [apps, tenants] = await Promise.all([listApplications(), listTenants()]);

  return (
    <div className="w-full min-w-0">
      <PageHeader
        title="OAuth client registry"
        description="Enterprise client onboarding: confidential and public applications, grant types, PKCE, redirect URIs, and protocol endpoints. Operational work stays in each application console."
        actions={<ApplicationFormModal tenants={tenants} triggerLabel="+ Register client" />}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total clients" value={apps.length} />
        <StatCard
          label="Confidential"
          value={apps.filter((a) => a.confidential).length}
        />
        <StatCard label="Public (SPA / native)" value={apps.filter((a) => !a.confidential).length} />
        <StatCard label="Active" value={apps.filter((a) => a.status === "active").length} />
      </div>

      <ClientRegistry apps={apps} tenants={tenants} />
    </div>
  );
}
