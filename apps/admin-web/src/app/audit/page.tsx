import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { getAuditEvents } from "@/lib/data";
import { AuditTable } from "./AuditTable";

export default function AuditPage() {
  const events = getAuditEvents();

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
