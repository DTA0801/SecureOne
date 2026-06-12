import { appScopeHeaders } from "./http";
import { browserApiFetch as apiFetch } from "./browser-client";
import type { RbacGroup, RbacGroupDetail } from "@/lib/types";

function appRbacBase(applicationId: string) {
  return `/api/admin/v1/applications/${applicationId}`;
}

type GroupSummaryDto = {
  id: string;
  tenantId: string;
  applicationId: string;
  name: string;
  description: string;
  createdAt: string;
  roleCount: number;
  memberCount: number;
};

type GroupDetailDto = GroupSummaryDto & {
  roleIds: string[];
  memberUserIds: string[];
  roles: { id: string; name: string }[];
  members: {
    id: string;
    email: string;
    username: string;
    displayName: string;
    status: string;
    emailVerified: boolean;
    addedAt: string | null;
  }[];
};

function mapSummary(dto: GroupSummaryDto): RbacGroup {
  return {
    id: dto.id,
    tenantId: dto.tenantId,
    applicationId: dto.applicationId,
    name: dto.name,
    description: dto.description ?? "",
    createdAt: dto.createdAt,
    roleCount: dto.roleCount ?? 0,
    memberCount: dto.memberCount ?? 0,
    roleIds: [],
    memberUserIds: [],
  };
}

function mapDetail(dto: GroupDetailDto): RbacGroupDetail {
  const summary = mapSummary(dto);
  return {
    ...summary,
    roleIds: dto.roleIds ?? [],
    memberUserIds: dto.memberUserIds ?? [],
    roles: dto.roles ?? [],
    members: (dto.members ?? []).map((m) => ({
      id: m.id,
      email: m.email,
      username: m.username ?? "",
      displayName: m.displayName ?? "",
      status: m.status,
      emailVerified: m.emailVerified,
      addedAt: m.addedAt,
    })),
  };
}

export async function listGroups(applicationId: string): Promise<RbacGroup[]> {
  return (
    await apiFetch<GroupSummaryDto[]>(`${appRbacBase(applicationId)}/groups`, {
      headers: appScopeHeaders(applicationId),
    })
  ).map(mapSummary);
}

export async function getGroup(applicationId: string, groupId: string): Promise<RbacGroupDetail> {
  return mapDetail(
    await apiFetch<GroupDetailDto>(`${appRbacBase(applicationId)}/groups/${groupId}`, {
      headers: appScopeHeaders(applicationId),
    }),
  );
}

export async function createGroupApi(input: {
  tenantId: string;
  applicationId: string;
  name: string;
  description: string;
  roleIds: string[];
  memberUserIds: string[];
}): Promise<RbacGroupDetail> {
  return mapDetail(
    await apiFetch<GroupDetailDto>(`${appRbacBase(input.applicationId)}/groups`, {
      method: "POST",
      headers: appScopeHeaders(input.applicationId),
      body: JSON.stringify(input),
    }),
  );
}

export async function updateGroupApi(
  applicationId: string,
  groupId: string,
  input: {
    name: string;
    description: string;
    roleIds: string[];
    memberUserIds: string[];
  },
): Promise<RbacGroupDetail> {
  return mapDetail(
    await apiFetch<GroupDetailDto>(`${appRbacBase(applicationId)}/groups/${groupId}`, {
      method: "PUT",
      headers: appScopeHeaders(applicationId),
      body: JSON.stringify(input),
    }),
  );
}

export async function deleteGroupApi(applicationId: string, groupId: string): Promise<void> {
  await apiFetch<void>(`${appRbacBase(applicationId)}/groups/${groupId}`, {
    method: "DELETE",
    headers: appScopeHeaders(applicationId),
  });
}

export async function probeGroupsApi(applicationId: string): Promise<boolean> {
  try {
    await apiFetch<unknown[]>(`${appRbacBase(applicationId)}/groups`, {
      headers: appScopeHeaders(applicationId),
    });
    return true;
  } catch {
    return false;
  }
}
