import { appScopeHeaders } from "./http";
import { browserApiFetch as apiFetch } from "./browser-client";
import type { Permission, Role, RoleAssignedUser, RoleDetail, RoleLabel } from "@/lib/types";

type RoleSummaryDto = {
  id: string;
  tenantId: string;
  applicationId: string;
  name: string;
  description: string;
  isComposite: boolean;
  isSystem?: boolean;
  isDefault?: boolean;
  label?: string;
  userCount: number;
  permissionCount?: number;
  childRoleCount?: number;
};

type RoleDetailDto = RoleSummaryDto & {
  permissionIds: string[];
  childRoleIds: string[];
  childRoles: { id: string; name: string }[];
  permissions: Permission[];
};

function appRbacBase(applicationId: string) {
  return `/api/admin/v1/applications/${applicationId}`;
}

/** Supports legacy role API responses (before enterprise label fields). */
function inferRoleLabel(dto: {
  name: string;
  isComposite?: boolean;
  isSystem?: boolean;
  isDefault?: boolean;
  label?: string;
}): RoleLabel {
  const raw = dto.label?.toUpperCase();
  if (raw === "SYSTEM" || raw === "BUILT_IN" || raw === "COMPOSITE" || raw === "CUSTOM") {
    return raw;
  }
  if (dto.isDefault) return "BUILT_IN";
  if (dto.isSystem) return "SYSTEM";
  if (dto.isComposite) return "COMPOSITE";
  const name = dto.name.toLowerCase();
  if (name.includes("super admin")) return "SYSTEM";
  if (name === "tenant admin" || name === "member") return "BUILT_IN";
  return "CUSTOM";
}

function mapSummary(dto: RoleSummaryDto): Role {
  const isSystem = Boolean(dto.isSystem);
  const isDefault = Boolean(dto.isDefault);
  return {
    id: dto.id,
    tenantId: dto.tenantId,
    applicationId: dto.applicationId,
    name: dto.name,
    description: dto.description ?? "",
    isComposite: Boolean(dto.isComposite),
    isSystem,
    isDefault,
    label: inferRoleLabel({ ...dto, isSystem, isDefault }),
    permissionIds: [],
    childRoleIds: [],
    userCount: dto.userCount ?? 0,
    permissionCount: dto.permissionCount ?? 0,
    childRoleCount: dto.childRoleCount ?? 0,
  };
}

function mapDetail(dto: RoleDetailDto): RoleDetail {
  const summary = mapSummary(dto);
  return {
    ...summary,
    permissionIds: dto.permissionIds ?? [],
    childRoleIds: dto.childRoleIds ?? [],
    permissions: (dto.permissions ?? []).map((p) => ({
      id: p.id,
      key: p.key,
      resource: p.resource ?? p.key.split(":")[0] ?? p.key,
      action: p.action ?? p.key.split(":")[1] ?? "access",
      description: p.description ?? "",
    })),
    childRoles: dto.childRoles ?? [],
  };
}

export async function listRoles(opts?: { tenantId?: string; applicationId?: string }): Promise<Role[]> {
  if (opts?.applicationId) {
    return (
      await apiFetch<RoleSummaryDto[]>(`${appRbacBase(opts.applicationId)}/roles`, {
        headers: appScopeHeaders(opts.applicationId),
      })
    ).map(mapSummary);
  }
  const params = new URLSearchParams();
  if (opts?.tenantId) params.set("tenantId", opts.tenantId);
  const qs = params.toString();
  const path = qs ? `/api/admin/v1/roles?${qs}` : "/api/admin/v1/roles";
  return (await apiFetch<RoleSummaryDto[]>(path)).map(mapSummary);
}

/** Load role detail; falls back to summary row when enterprise detail API is unavailable. */
export async function getRole(
  id: string,
  applicationId?: string,
  fallback?: Role,
): Promise<RoleDetail> {
  try {
    const path = applicationId
      ? `${appRbacBase(applicationId)}/roles/${id}`
      : `/api/admin/v1/roles/${id}${applicationId ? `?applicationId=${applicationId}` : ""}`;
    return mapDetail(
      await apiFetch<RoleDetailDto>(path, {
        headers: applicationId ? appScopeHeaders(applicationId) : undefined,
      }),
    );
  } catch {
    if (fallback) {
      return {
        ...fallback,
        permissionIds: fallback.permissionIds ?? [],
        childRoleIds: fallback.childRoleIds ?? [],
        permissions: [],
        childRoles: [],
      };
    }
    throw new Error("Role not found");
  }
}

export async function probeRolesApi(applicationId: string): Promise<{
  enterprise: boolean;
  permissions: boolean;
}> {
  try {
    const roles = await listRoles({ applicationId });
    const enterprise =
      roles.length > 0 &&
      (roles[0].label !== undefined ||
        roles[0].permissionCount !== undefined ||
        roles[0].isSystem !== undefined);
    let permissions = false;
    try {
      await apiFetch<unknown[]>(`${appRbacBase(applicationId)}/permissions`, {
        headers: appScopeHeaders(applicationId),
      });
      permissions = true;
    } catch {
      permissions = false;
    }
    return { enterprise, permissions };
  } catch {
    return { enterprise: false, permissions: false };
  }
}

export async function createRoleApi(input: {
  tenantId: string;
  applicationId: string;
  name: string;
  description: string;
  isComposite: boolean;
  permissionIds: string[];
  childRoleIds: string[];
}): Promise<RoleDetail> {
  return mapDetail(
    await apiFetch<RoleDetailDto>(`${appRbacBase(input.applicationId)}/roles`, {
      method: "POST",
      headers: appScopeHeaders(input.applicationId),
      body: JSON.stringify(input),
    }),
  );
}

export async function updateRoleApi(
  id: string,
  input: {
    name: string;
    description: string;
    isComposite: boolean;
    permissionIds: string[];
    childRoleIds: string[];
  },
  applicationId?: string,
): Promise<RoleDetail> {
  if (!applicationId) {
    throw new Error("applicationId is required to update a role");
  }
  return mapDetail(
    await apiFetch<RoleDetailDto>(`${appRbacBase(applicationId)}/roles/${id}`, {
      method: "PUT",
      headers: appScopeHeaders(applicationId),
      body: JSON.stringify(input),
    }),
  );
}

type RoleAssignedUserDto = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  status: string;
  emailVerified: boolean;
  grantedAt: string | null;
};

export async function listRoleUsers(
  applicationId: string,
  roleId: string,
): Promise<RoleAssignedUser[]> {
  return (
    await apiFetch<RoleAssignedUserDto[]>(
      `${appRbacBase(applicationId)}/roles/${roleId}/users`,
      { headers: appScopeHeaders(applicationId) },
    )
  ).map((u) => ({
    id: u.id,
    email: u.email,
    username: u.username ?? "",
    displayName: u.displayName ?? "",
    status: u.status,
    emailVerified: u.emailVerified,
    grantedAt: u.grantedAt,
  }));
}

export async function deleteRoleApi(id: string, applicationId?: string): Promise<void> {
  if (!applicationId) {
    throw new Error("applicationId is required to delete a role");
  }
  await apiFetch<void>(`${appRbacBase(applicationId)}/roles/${id}`, {
    method: "DELETE",
    headers: appScopeHeaders(applicationId),
  });
}
