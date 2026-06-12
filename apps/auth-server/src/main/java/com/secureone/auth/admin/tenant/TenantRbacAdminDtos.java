package com.secureone.auth.admin.tenant;

import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.UUID;

public final class TenantRbacAdminDtos {

    private TenantRbacAdminDtos() {}

    public record TenantPermissionResponse(UUID id, UUID tenantId, String key, String description) {}

    public record TenantRoleSummaryResponse(
            UUID id,
            UUID tenantId,
            String name,
            String description,
            boolean systemRole,
            long userCount,
            long permissionCount,
            int applicationScopeCount) {}

    public record TenantRoleDetailResponse(
            UUID id,
            UUID tenantId,
            String name,
            String description,
            boolean systemRole,
            List<UUID> permissionIds,
            List<UUID> applicationIds,
            List<TenantPermissionResponse> permissions,
            long userCount) {}

    public record TenantRoleCreateRequest(
            @NotBlank String name, String description, List<UUID> permissionIds, List<UUID> applicationIds) {}

    public record TenantRoleUpdateRequest(
            @NotBlank String name, String description, List<UUID> permissionIds, List<UUID> applicationIds) {}

    public record TenantPermissionCreateRequest(@NotBlank String key, String description) {}
}
