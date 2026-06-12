package com.secureone.auth.admin.role;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class GroupAdminDtos {

    private GroupAdminDtos() {}

    public record GroupRefResponse(UUID id, String name) {}

    public record GroupMemberResponse(
            UUID id,
            String email,
            String username,
            String displayName,
            String status,
            boolean emailVerified,
            Instant addedAt) {}

    public record GroupSummaryResponse(
            UUID id,
            UUID tenantId,
            UUID applicationId,
            String name,
            String description,
            Instant createdAt,
            int roleCount,
            int memberCount) {}

    public record GroupDetailResponse(
            UUID id,
            UUID tenantId,
            UUID applicationId,
            String name,
            String description,
            Instant createdAt,
            int roleCount,
            int memberCount,
            List<UUID> roleIds,
            List<UUID> memberUserIds,
            List<RoleAdminDtos.RoleRefResponse> roles,
            List<GroupMemberResponse> members) {}

    public record GroupCreateRequest(
            @NotNull UUID tenantId,
            @NotNull UUID applicationId,
            @NotBlank String name,
            String description,
            List<UUID> roleIds,
            List<UUID> memberUserIds) {}

    public record GroupUpdateRequest(
            @NotBlank String name,
            String description,
            List<UUID> roleIds,
            List<UUID> memberUserIds) {}

    public record RolePermissionPatchRequest(@NotNull UUID permissionId) {}
}
