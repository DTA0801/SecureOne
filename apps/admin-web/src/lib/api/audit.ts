import { appScopeHeaders } from "./http";
import { browserApiFetch as apiFetch } from "./browser-client";
import type { AuditEvent } from "@/lib/types";

type AuditDto = {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  ip: string;
  result: string;
};

export async function listAuditEvents(applicationId: string, tenantId: string): Promise<AuditEvent[]> {
  const params = new URLSearchParams({ applicationId, tenantId });
  const rows = await apiFetch<AuditDto[]>(`/api/admin/v1/audit?${params}`, {
    headers: appScopeHeaders(applicationId),
  });
  return rows.map((r) => ({
    id: r.id,
    timestamp: r.timestamp,
    actor: r.actor,
    action: r.action,
    target: r.target,
    ip: r.ip,
    result: r.result as AuditEvent["result"],
  }));
}
