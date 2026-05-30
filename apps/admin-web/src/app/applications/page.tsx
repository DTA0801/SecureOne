import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { ApplicationFormModal } from "@/components/forms/ApplicationFormModal";
import { listApplications } from "@/lib/api/applications";
import { listTenants } from "@/lib/api/tenants";
import { statusTone } from "@/lib/status";
import type { AppType } from "@/lib/types";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<AppType, string> = {
  web: "Web App",
  spa: "SPA",
  native: "Native",
  m2m: "Machine-to-Machine",
};

export default async function ApplicationsPage() {
  const [apps, tenants] = await Promise.all([listApplications(), listTenants()]);
  const tenantMap = new Map(tenants.map((t) => [t.id, t.name]));

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Applications"
        description="OAuth 2.1 / OIDC clients and relying parties registered across tenants."
        actions={<ApplicationFormModal tenants={tenants} triggerLabel="+ Register client" />}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total clients" value={apps.length} />
        <StatCard label="Confidential" value={apps.filter((a) => a.type === "web" || a.type === "m2m").length} />
        <StatCard label="Public" value={apps.filter((a) => a.type === "spa" || a.type === "native").length} />
        <StatCard label="Active" value={apps.filter((a) => a.status === "active").length} />
      </div>

      <Table>
        <THead>
          <tr>
            <TH>Application</TH>
            <TH>Tenant</TH>
            <TH>Type</TH>
            <TH>Grant types</TH>
            <TH>Status</TH>
          </tr>
        </THead>
        <TBody>
          {apps.map((a) => (
            <TR key={a.id}>
              <TD>
                <Link href={`/applications/${a.id}`} className="link-brand">{a.name}</Link>
                <p className="font-mono text-xs text-faint">{a.clientId}</p>
              </TD>
              <TD className="text-muted">{tenantMap.get(a.tenantId) ?? a.tenantId}</TD>
              <TD><Badge tone="indigo">{TYPE_LABEL[a.type]}</Badge></TD>
              <TD>
                <div className="flex flex-wrap gap-1">
                  {a.grantTypes.map((g) => (
                    <span key={g} className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[10px] dark:bg-white/10">{g}</span>
                  ))}
                </div>
              </TD>
              <TD><Badge tone={statusTone(a.status)} dot className="capitalize">{a.status}</Badge></TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
