import { apiFetch } from "./client";
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

export async function listAuditEvents(): Promise<AuditEvent[]> {
  const rows = await apiFetch<AuditDto[]>("/api/admin/v1/audit");
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
