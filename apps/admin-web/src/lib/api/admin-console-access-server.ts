import "server-only";

import { apiFetch } from "./server-client";
import type { ConsoleAccessAssignment } from "./admin-console-access";

export async function listConsoleAccess(tenantId: string): Promise<ConsoleAccessAssignment[]> {
  return apiFetch<ConsoleAccessAssignment[]>(
    `/api/admin/v1/tenants/${tenantId}/console-access`,
  );
}
