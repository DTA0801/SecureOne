import "server-only";

import { apiFetch } from "./server-client";
import type { TenantAdminOperator } from "./tenant-admins";

type UserDto = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
};

function mapAdminUser(dto: UserDto): TenantAdminOperator {
  const displayName = `${dto.firstName} ${dto.lastName}`.trim() || dto.email;
  return {
    userId: dto.id,
    email: dto.email,
    displayName,
    status: dto.status,
    tenantAdminApplicationIds: [],
  };
}

export async function listTenantAdminOperators(tenantId: string): Promise<TenantAdminOperator[]> {
  try {
    return await apiFetch<TenantAdminOperator[]>(
      `/api/admin/v1/tenant-workspace/admin-operators?tenantId=${tenantId}`,
    );
  } catch {
    const users = await apiFetch<UserDto[]>(
      `/api/admin/v1/users?tenantId=${tenantId}&adminOnly=true`,
    );
    return users.map(mapAdminUser);
  }
}
