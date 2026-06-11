import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { resolveApplicationMeta } from "@/lib/api/app-workspace";
import { listLoginEvents } from "@/lib/api/sessions";
import { Badge } from "@/components/ui/Badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AppSessionsPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  const app = await resolveApplicationMeta(applicationId);
  if (!app) notFound();

  let sessions: Awaited<ReturnType<typeof listLoginEvents>> = [];
  try {
    sessions = await listLoginEvents({ applicationId, tenantId: app.tenantId });
  } catch {
    /* show empty */
  }

  return (
    <div className="w-full min-w-0">
      <PageHeader
        breadcrumb={<Link href={`/app/${applicationId}/sessions`} className="hover:underline">Sessions</Link>}
        title="Sessions"
        description={`Sign-in history for ${app.name}`}
      />
      <Table>
        <THead>
          <TR>
            <TH>User</TH>
            <TH>Method</TH>
            <TH>Result</TH>
            <TH>Session</TH>
            <TH>When</TH>
          </TR>
        </THead>
        <TBody>
          {sessions.map((s) => (
            <TR key={s.id}>
              <TD>{s.userEmail}</TD>
              <TD>{s.method}</TD>
              <TD>
                <Badge tone={s.result === "success" ? "success" : "danger"}>{s.result}</Badge>
              </TD>
              <TD className="font-mono text-xs">
                {s.sessionId ? (
                  <Link
                    href={`/app/${applicationId}/logs?sessionId=${encodeURIComponent(s.sessionId)}`}
                    className="text-brand hover:underline"
                    title={s.sessionId}
                  >
                    {s.sessionId.slice(0, 12)}…
                  </Link>
                ) : (
                  "—"
                )}
              </TD>
              <TD className="text-sm text-muted">{formatDateTime(s.timestamp)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
