package com.secureone.auth.admin.role;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class RoleAdminDtos {

    private RoleAdminDtos() {}

    public record PermissionResponse(
            UUID id,
            UUID applicationId,
            String key,
            String resource,
            String action,
            String description,
            int roleCount) {}

    public record RoleRefResponse(UUID id, String name) {}

    public record RoleAssignedUserResponse(
            UUID id,
            String email,
            String username,
            String displayName,
            String status,
            boolean emailVerified,
            Instant grantedAt) {}

    public record SeedPermissionsResponse(int created, int totalInCatalog) {}

    public record RoleSummaryResponse(
            UUID id,
            UUID tenantId,
            UUID applicationId,
            String name,
            String description,
            boolean isComposite,
            boolean isSystem,
            boolean isDefault,
            String label,
            long userCount,
            int permissionCount,
            int childRoleCount) {}

    public record RoleDetailResponse(
            UUID id,
            UUID tenantId,
            UUID applicationId,
            String name,
            String description,
            boolean isComposite,
            boolean isSystem,
            boolean isDefault,
            String label,
            long userCount,
            List<UUID> permissionIds,
            List<UUID> childRoleIds,
            List<RoleRefResponse> childRoles,
            List<PermissionResponse> permissions) {}

    public record RoleCreateRequest(
            @NotNull UUID tenantId,
            @NotNull UUID applicationId,
            @NotBlank String name,
            String description,
            boolean isComposite,
            List<UUID> permissionIds,
            List<UUID> childRoleIds) {}

    public record RoleUpdateRequest(
            @NotBlank String name,
            String description,
            boolean isComposite,
            List<UUID> permissionIds,
            List<UUID> childRoleIds) {}
}
