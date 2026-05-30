import { apiFetch } from "./client";
import type { User } from "@/lib/types";

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
    mfaFactors: [],
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
