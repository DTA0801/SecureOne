import { apiFetch } from "./client";
import type { User } from "@/lib/types";

type MfaFactorDto = {
  id: string;
  type: string;
  label: string;
  verified: boolean;
};

type UserDto = {
  id: string;
  tenantId: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  status: string;
  emailVerified: boolean;
  roleIds: string[];
  mfaFactors?: MfaFactorDto[];
  lastLoginAt: string | null;
  createdAt: string;
};

function mapUser(dto: UserDto): User {
  return {
    id: dto.id,
    tenantId: dto.tenantId,
    email: dto.email,
    username: dto.username,
    firstName: dto.firstName,
    lastName: dto.lastName,
    status: dto.status as User["status"],
    emailVerified: dto.emailVerified,
    roleIds: dto.roleIds,
    mfaFactors: (dto.mfaFactors ?? []).map((f) => ({
      id: f.id,
      type: f.type as import("@/lib/types").MfaFactorType,
      label: f.label,
      verified: f.verified,
      addedAt: dto.createdAt,
    })),
    lastLoginAt: dto.lastLoginAt,
    createdAt: dto.createdAt,
  };
}

export async function listUsers(tenantId?: string): Promise<User[]> {
  const path = tenantId
    ? `/api/admin/v1/users?tenantId=${tenantId}`
    : "/api/admin/v1/users";
  const rows = await apiFetch<UserDto[]>(path);
  return rows.map(mapUser);
}

/** Users assigned to a role whose name contains "admin" (Tenant Admin, Super Admin, …). */
export async function listAdminUsers(tenantId?: string): Promise<User[]> {
  const params = new URLSearchParams({ adminOnly: "true" });
  if (tenantId) params.set("tenantId", tenantId);
  const rows = await apiFetch<UserDto[]>(`/api/admin/v1/users?${params}`);
  return rows.map(mapUser);
}

export async function getUser(id: string): Promise<User | null> {
  try {
    const dto = await apiFetch<UserDto>(`/api/admin/v1/users/${id}`);
    return mapUser(dto);
  } catch (e) {
    if (e instanceof Error && "status" in e && (e as { status: number }).status === 404) {
      return null;
    }
    throw e;
  }
}

export async function createUserApi(input: {
  tenantId: string;
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  status: string;
  roleIds: string[];
}): Promise<User> {
  const dto = await apiFetch<UserDto>("/api/admin/v1/users", {
    method: "POST",
    body: JSON.stringify({
      tenantId: input.tenantId,
      email: input.email,
      username: input.username,
      firstName: input.firstName,
      lastName: input.lastName,
      status: input.status,
      roleIds: input.roleIds,
    }),
  });
  return mapUser(dto);
}

export async function updateUserApi(
  id: string,
  input: {
    email: string;
    username?: string;
    firstName: string;
    lastName: string;
    status: string;
    roleIds: string[];
  },
): Promise<User> {
  const dto = await apiFetch<UserDto>(`/api/admin/v1/users/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      email: input.email,
      username: input.username,
      firstName: input.firstName,
      lastName: input.lastName,
      status: input.status,
      roleIds: input.roleIds,
    }),
  });
  return mapUser(dto);
}

export async function deleteUserApi(id: string): Promise<void> {
  await apiFetch<void>(`/api/admin/v1/users/${id}`, { method: "DELETE" });
}

export async function setUserStatusApi(id: string, status: string): Promise<void> {
  await apiFetch<UserDto>(`/api/admin/v1/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function sendUserPasswordResetEmailApi(id: string): Promise<void> {
  await apiFetch(`/api/admin/v1/users/${id}/password/reset-email`, { method: "POST" });
}

export async function resendUserVerificationEmailApi(id: string): Promise<void> {
  await apiFetch(`/api/admin/v1/users/${id}/email/resend-verification`, { method: "POST" });
}

export async function markUserEmailVerifiedApi(id: string): Promise<User> {
  const dto = await apiFetch<UserDto>(`/api/admin/v1/users/${id}/email/verify`, { method: "POST" });
  return mapUser(dto);
}

export async function resetUserMfaApi(id: string): Promise<void> {
  await apiFetch<void>(`/api/admin/v1/users/${id}/mfa/reset`, { method: "POST" });
}
