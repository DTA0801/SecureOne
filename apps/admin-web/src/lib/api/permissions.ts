import { ApiError, apiFetch, appScopeHeaders } from "./client";
import type { Permission, PermissionDetail } from "@/lib/types";

type PermissionDto = {
  id: string;
  applicationId: string;
  key: string;
  resource: string;
  action: string;
  description: string;
  roleCount?: number;
};

type PermissionDetailDto = PermissionDto & {
  roleCount: number;
  roles: { id: string; name: string }[];
};

function appRbacBase(applicationId: string) {
  return `/api/admin/v1/applications/${applicationId}`;
}

function mapPermission(dto: PermissionDto): Permission {
  return {
    id: dto.id,
    applicationId: dto.applicationId,
    key: dto.key,
    resource: dto.resource ?? dto.key.split(":")[0] ?? dto.key,
    action: dto.action ?? dto.key.split(":")[1] ?? "access",
    description: dto.description ?? "",
    roleCount: dto.roleCount ?? 0,
  };
}

function mapDetail(dto: PermissionDetailDto): PermissionDetail {
  return {
    ...mapPermission(dto),
    roleCount: dto.roleCount ?? 0,
    roles: dto.roles ?? [],
  };
}

/** True when app-scoped RBAC routes are available on auth-server. */
export async function probePermissionsApi(applicationId: string): Promise<boolean> {
  try {
    await apiFetch<unknown[]>(`${appRbacBase(applicationId)}/permissions`, {
      headers: appScopeHeaders(applicationId),
    });
    return true;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return false;
    throw e;
  }
}

async function listPermissionsScoped(applicationId: string): Promise<Permission[]> {
  return (
    await apiFetch<PermissionDto[]>(`${appRbacBase(applicationId)}/permissions`, {
      headers: appScopeHeaders(applicationId),
    })
  ).map(mapPermission);
}

/** Legacy flat route (pre–app-scoped RBAC controller). */
async function listPermissionsLegacy(applicationId: string): Promise<Permission[]> {
  const params = new URLSearchParams({ applicationId });
  return (
    await apiFetch<PermissionDto[]>(`/api/admin/v1/permissions?${params}`, {
      headers: appScopeHeaders(applicationId),
    })
  ).map(mapPermission);
}

export async function listPermissions(applicationId: string): Promise<Permission[]> {
  try {
    return await listPermissionsScoped(applicationId);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      return listPermissionsLegacy(applicationId);
    }
    throw e;
  }
}

export async function getPermission(
  applicationId: string,
  permissionId: string,
): Promise<PermissionDetail> {
  try {
    return mapDetail(
      await apiFetch<PermissionDetailDto>(
        `${appRbacBase(applicationId)}/permissions/${permissionId}`,
        { headers: appScopeHeaders(applicationId) },
      ),
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      const list = await listPermissionsLegacy(applicationId);
      const row = list.find((p) => p.id === permissionId);
      if (row) {
        return { ...row, roles: [], roleCount: row.roleCount ?? 0 };
      }
    }
    throw e;
  }
}

export async function createPermissionApi(
  applicationId: string,
  input: { key: string; description: string },
): Promise<PermissionDetail> {
  return mapDetail(
    await apiFetch<PermissionDetailDto>(`${appRbacBase(applicationId)}/permissions`, {
      method: "POST",
      headers: appScopeHeaders(applicationId),
      body: JSON.stringify(input),
    }),
  );
}

export async function updatePermissionApi(
  applicationId: string,
  permissionId: string,
  input: { key?: string; description?: string },
): Promise<PermissionDetail> {
  return mapDetail(
    await apiFetch<PermissionDetailDto>(
      `${appRbacBase(applicationId)}/permissions/${permissionId}`,
      {
        method: "PUT",
        headers: appScopeHeaders(applicationId),
        body: JSON.stringify(input),
      },
    ),
  );
}

export async function seedDefaultPermissionsApi(
  applicationId: string,
): Promise<{ created: number; totalInCatalog: number }> {
  try {
    return await apiFetch<{ created: number; totalInCatalog: number }>(
      `${appRbacBase(applicationId)}/permissions/seed-defaults`,
      {
        method: "POST",
        headers: appScopeHeaders(applicationId),
      },
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      throw new ApiError(
        "Permission API not found. Stop the old auth-server process and run: cd apps/auth-server && .\\gradlew.bat bootRun",
        404,
        e.body,
      );
    }
    throw e;
  }
}

export async function deletePermissionApi(
  applicationId: string,
  permissionId: string,
): Promise<void> {
  await apiFetch<void>(`${appRbacBase(applicationId)}/permissions/${permissionId}`, {
    method: "DELETE",
    headers: appScopeHeaders(applicationId),
  });
}
