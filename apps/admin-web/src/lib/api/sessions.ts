import { apiFetch } from "./client";
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
};

export async function listLoginEvents(userId?: string): Promise<LoginEvent[]> {
  const path = userId
    ? `/api/admin/v1/sessions?userId=${encodeURIComponent(userId)}`
    : "/api/admin/v1/sessions";
  const rows = await apiFetch<SessionDto[]>(path);
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
  }));
}
