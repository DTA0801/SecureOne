"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AssignTenantAdminDialog } from "@/components/tenants/AssignTenantAdminDialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import {
  listTenantAdminOperators,
  revokeTenantAdminOperator,
  type TenantAdminOperator,
} from "@/lib/api/tenant-admins";
import { statusTone } from "@/lib/status";
import type { Application, Status, User } from "@/lib/types";

export function TenantAdminsPanel({
  tenantId,
  applications,
  users,
  initialAdmins,
}: {
  tenantId: string;
  applications: Application[];
  users: User[];
  initialAdmins: TenantAdminOperator[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [admins, setAdmins] = useState(initialAdmins);
  const [assignOpen, setAssignOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const appById = useMemo(
    () => new Map(applications.map((a) => [a.id, a])),
    [applications],
  );

  async function refresh() {
    const next = await listTenantAdminOperators(tenantId);
    setAdmins(next);
    router.refresh();
  }

  async function handleRevoke(adminUserId: string, appId: string) {
    const key = `${adminUserId}:${appId}`;
    setBusy(key);
    try {
      await revokeTenantAdminOperator(tenantId, adminUserId, appId);
      toast("Tenant Admin removed for application", "success");
      await refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not remove Tenant Admin", "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <Card padded={false} className="mt-6">
        <CardHeader
          title="Tenant Admins"
          description="Super-admin only. Tenant Admins manage users and application access within their organization."
          action={
            <Button
              size="sm"
              onClick={() => setAssignOpen(true)}
              disabled={applications.length === 0}
            >
              + Assign Tenant Admin
            </Button>
          }
        />
        <Table>
          <THead>
            <tr>
              <TH>User</TH>
              <TH>Status</TH>
              <TH>Tenant Admin on</TH>
            </tr>
          </THead>
          <TBody>
            {admins.map((admin) => (
              <TR key={admin.userId}>
                <TD>
                  <p className="font-medium">{admin.displayName}</p>
                  <p className="text-xs text-faint">{admin.email}</p>
                </TD>
                <TD>
                  <Badge tone={statusTone(admin.status as Status)} dot className="capitalize">
                    {admin.status}
                  </Badge>
                </TD>
                <TD>
                  {admin.tenantAdminApplicationIds.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {admin.tenantAdminApplicationIds.map((appId) => {
                        const app = appById.get(appId);
                        const key = `${admin.userId}:${appId}`;
                        return (
                          <div
                            key={appId}
                            className="flex items-center justify-between gap-2 text-sm"
                          >
                            <span>{app?.name ?? appId}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={busy === key}
                              onClick={() => void handleRevoke(admin.userId, appId)}
                            >
                              Remove
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-xs text-faint">Tenant Admin (all tenant applications)</span>
                  )}
                </TD>
              </TR>
            ))}
            {admins.length === 0 && (
              <TR>
                <TD colSpan={3} className="py-8 text-center text-sm text-faint">
                  No Tenant Admins assigned yet. Use &quot;Assign Tenant Admin&quot; to promote a
                  user from the tenant or an application member list.
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </Card>

      <AssignTenantAdminDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        tenantId={tenantId}
        applications={applications}
        tenantUsers={users}
        onAssigned={refresh}
      />
    </>
  );
}
