import { appScopeHeaders } from "./http";
import { browserApiFetch as apiFetch } from "./browser-client";
import type { LoginEvent } from "@/lib/types";

type SessionDto = {
  id: string;
  userId: string;
  userEmail: string;
  timestamp: string;
  ip: string;
  location: string;
  device: string;
  method: string;
  result: string;
  sessionId?: string | null;
};

export async function listLoginEvents(opts?: {
  userId?: string;
  applicationId?: string;
  tenantId?: string;
}): Promise<LoginEvent[]> {
  const params = new URLSearchParams();
  if (opts?.userId) params.set("userId", opts.userId);
  if (opts?.applicationId) params.set("applicationId", opts.applicationId);
  if (opts?.tenantId) params.set("tenantId", opts.tenantId);
  const qs = params.toString();
  const path = qs ? `/api/admin/v1/sessions?${qs}` : "/api/admin/v1/sessions";
  const rows = await apiFetch<SessionDto[]>(path, {
    headers: opts?.applicationId ? appScopeHeaders(opts.applicationId) : undefined,
  });
  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    userEmail: r.userEmail,
    timestamp: r.timestamp,
    ip: r.ip,
    location: r.location,
    device: r.device,
    method: r.method as LoginEvent["method"],
    result: r.result as LoginEvent["result"],
    sessionId: r.sessionId ?? null,
  }));
}
