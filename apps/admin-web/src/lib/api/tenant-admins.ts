import { browserApiFetch as apiFetch } from "./browser-client";
import { listAdminUsers } from "./users";

export type TenantAdminOperator = {
  userId: string;
  email: string;
  displayName: string;
  status: string;
  tenantAdminApplicationIds: string[];
};

function mapAdminUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
}): TenantAdminOperator {
  const displayName = `${user.firstName} ${user.lastName}`.trim() || user.email;
  return {
    userId: user.id,
    email: user.email,
    displayName,
    status: user.status,
    tenantAdminApplicationIds: [],
  };
}

/** Uses tenant-workspace API (deployed path). Falls back to admin user list. */
export async function listTenantAdminOperators(tenantId: string): Promise<TenantAdminOperator[]> {
  try {
    return await apiFetch<TenantAdminOperator[]>(
      `/api/admin/v1/tenant-workspace/admin-operators?tenantId=${tenantId}`,
    );
  } catch {
    const users = await listAdminUsers(tenantId);
    return users.map(mapAdminUser);
  }
}

export async function assignTenantAdminOperator(
  _tenantId: string,
  userId: string,
  applicationId: string,
): Promise<void> {
  await apiFetch<{ ok: boolean }>(
    `/api/admin/v1/tenant-workspace/users/${userId}/tenant-admin/${applicationId}`,
    { method: "POST" },
  );
}

export async function revokeTenantAdminOperator(
  _tenantId: string,
  userId: string,
  applicationId: string,
): Promise<void> {
  await apiFetch<void>(
    `/api/admin/v1/tenant-workspace/users/${userId}/tenant-admin/${applicationId}`,
    { method: "DELETE" },
  );
}
