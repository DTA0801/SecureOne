import { appScopeHeaders } from "./http";
import { browserApiFetch as apiFetch } from "./browser-client";
import type { ApplicationLogEntry } from "@/lib/types";

type LogDto = {
  id: string;
  timestamp: string;
  level: string;
  logger: string;
  message: string;
  sessionId: string | null;
  requestId: string | null;
  principal: string | null;
  tenantId: string | null;
  applicationId: string | null;
  ip: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown>;
};

export type LogQuery = {
  sessionId?: string;
  requestId?: string;
  level?: string;
  applicationId?: string;
  tenantId?: string;
  since?: string;
  until?: string;
  search?: string;
  limit?: number;
  includeUnscoped?: boolean;
};

export async function listApplicationLogs(query: LogQuery = {}): Promise<ApplicationLogEntry[]> {
  const params = new URLSearchParams();
  if (query.sessionId) params.set("sessionId", query.sessionId);
  if (query.requestId) params.set("requestId", query.requestId);
  if (query.level) params.set("level", query.level);
  if (query.applicationId) params.set("applicationId", query.applicationId);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  if (query.since) params.set("since", query.since);
  if (query.until) params.set("until", query.until);
  if (query.search) params.set("search", query.search);
  if (query.limit) params.set("limit", String(query.limit));
  if (query.includeUnscoped === false) params.set("includeUnscoped", "false");

  const qs = params.toString();
  const path = qs ? `/api/admin/v1/logs?${qs}` : "/api/admin/v1/logs";
  const rows = await apiFetch<LogDto[]>(path, {
    headers: query.applicationId ? appScopeHeaders(query.applicationId) : undefined,
  });
  return rows.map(mapLogDto);
}

export async function deleteApplicationLogs(
  query: LogQuery & { since: string; until: string },
): Promise<{ deleted: number; matched: number }> {
  const params = new URLSearchParams();
  if (query.sessionId) params.set("sessionId", query.sessionId);
  if (query.requestId) params.set("requestId", query.requestId);
  if (query.level) params.set("level", query.level);
  if (query.applicationId) params.set("applicationId", query.applicationId);
  if (query.tenantId) params.set("tenantId", query.tenantId);
  params.set("since", query.since);
  params.set("until", query.until);
  if (query.search) params.set("search", query.search);
  if (query.includeUnscoped === false) params.set("includeUnscoped", "false");

  const qs = params.toString();
  return apiFetch<{ deleted: number; matched: number }>(`/api/admin/v1/logs?${qs}`, {
    method: "DELETE",
    headers: query.applicationId ? appScopeHeaders(query.applicationId) : undefined,
  });
}

function mapLogDto(r: LogDto): ApplicationLogEntry {
  return {
    id: r.id,
    timestamp: r.timestamp,
    level: r.level as ApplicationLogEntry["level"],
    logger: r.logger,
    message: r.message,
    sessionId: r.sessionId,
    requestId: r.requestId,
    principal: r.principal,
    tenantId: r.tenantId,
    applicationId: r.applicationId,
    ip: r.ip,
    userAgent: r.userAgent,
    metadata: r.metadata ?? {},
  };
}
