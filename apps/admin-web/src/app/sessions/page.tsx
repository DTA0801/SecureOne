import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { getLoginEvents, getUsers } from "@/lib/data";
import { formatDateTime } from "@/lib/format";

export default function SessionsPage() {
  const logins = getLoginEvents();
  const userByEmail = new Map(getUsers().map((u) => [u.email, u.id]));
  const successes = logins.filter((l) => l.result === "success").length;
  const failures = logins.filter((l) => l.result === "failure").length;
  const mfaChallenges = logins.filter((l) => l.result === "mfa_required").length;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Sessions"
        description="Login history and authentication outcomes across the platform."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Sign-in attempts" value={logins.length} hint="last 24h" />
        <StatCard label="Successful" value={successes} />
        <StatCard label="MFA challenges" value={mfaChallenges} />
        <StatCard label="Failed" value={failures} delta={failures > 0 ? { value: `${failures}`, positive: false } : undefined} hint="review" />
      </div>

      <Table>
        <THead>
          <tr>
            <TH>User</TH>
            <TH>Method</TH>
            <TH>Result</TH>
            <TH>Location</TH>
            <TH>Device</TH>
            <TH>IP</TH>
            <TH>Time</TH>
          </tr>
        </THead>
        <TBody>
          {logins.map((l) => {
            const uid = userByEmail.get(l.userEmail);
            return (
              <TR key={l.id}>
                <TD>
                  {uid ? (
                    <Link href={`/users/${uid}`} className="font-medium hover:text-indigo-600 dark:hover:text-indigo-400">{l.userEmail}</Link>
                  ) : (
                    <span className="font-medium">{l.userEmail}</span>
                  )}
                </TD>
                <TD><Badge tone="neutral" className="capitalize">{l.method}</Badge></TD>
                <TD>
                  <Badge tone={l.result === "success" ? "success" : l.result === "failure" ? "danger" : "warning"} dot>
                    {l.result === "mfa_required" ? "MFA required" : l.result}
                  </Badge>
                </TD>
                <TD className="text-black/70 dark:text-white/70">{l.location}</TD>
                <TD className="text-black/55 dark:text-white/55">{l.device}</TD>
                <TD className="font-mono text-xs text-black/55 dark:text-white/55">{l.ip}</TD>
                <TD className="whitespace-nowrap text-black/55 dark:text-white/55">{formatDateTime(l.timestamp)}</TD>
              </TR>
            );
          })}
        </TBody>
      </Table>
    </div>
  );
}
