import { apiFetch } from "./client";
import type { Role } from "@/lib/types";

type RoleDto = {
  id: string;
  tenantId: string;
  applicationId: string;
  name: string;
  description: string;
  isComposite: boolean;
  userCount: number;
};

function mapRole(dto: RoleDto): Role {
  return {
    id: dto.id,
    tenantId: dto.tenantId,
    name: dto.name,
    description: dto.description ?? "",
    isComposite: dto.isComposite,
    permissionIds: [],
    childRoleIds: [],
    userCount: dto.userCount,
  };
}

export async function listRoles(tenantId?: string): Promise<Role[]> {
  const path = tenantId ? `/api/admin/v1/roles?tenantId=${tenantId}` : "/api/admin/v1/roles";
  return (await apiFetch<RoleDto[]>(path)).map(mapRole);
}

export async function createRoleApi(input: {
  tenantId: string;
  applicationId: string;
  name: string;
  description: string;
  isComposite: boolean;
}): Promise<Role> {
  return mapRole(
    await apiFetch<RoleDto>("/api/admin/v1/roles", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function updateRoleApi(
  id: string,
  input: { name: string; description: string; isComposite: boolean },
): Promise<Role> {
  return mapRole(
    await apiFetch<RoleDto>(`/api/admin/v1/roles/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  );
}

export async function deleteRoleApi(id: string): Promise<void> {
  await apiFetch<void>(`/api/admin/v1/roles/${id}`, { method: "DELETE" });
}
