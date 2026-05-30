import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { listAuditEvents } from "@/lib/api/audit";
import { AuditTable } from "./AuditTable";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const events = await listAuditEvents();

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Audit Log"
        description="Immutable record of administrative and security-relevant events."
        actions={<Button variant="secondary">Export</Button>}
      />
      <AuditTable events={events} />
    </div>
  );
}
