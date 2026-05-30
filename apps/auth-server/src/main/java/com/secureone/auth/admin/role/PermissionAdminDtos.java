package com.secureone.auth.admin.role;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public final class PermissionAdminDtos {

    private PermissionAdminDtos() {}

    public record PermissionCreateRequest(
            @NotBlank
            @Size(max = 150)
            @Pattern(
                    regexp = "^[a-z][a-z0-9_-]*:[a-z][a-z0-9_-]*$",
                    message = "Key must be resource:action (lowercase, e.g. user:read)")
            String key,
            @Size(max = 500) String description) {}

    public record PermissionUpdateRequest(
            @Size(max = 500) String description,
            @Size(max = 150)
            @Pattern(
                    regexp = "^[a-z][a-z0-9_-]*:[a-z][a-z0-9_-]*$",
                    message = "Key must be resource:action (lowercase, e.g. user:read)")
            String key) {}

    public record PermissionDetailResponse(
            UUID id,
            UUID applicationId,
            String key,
            String resource,
            String action,
            String description,
            int roleCount,
            List<RoleAdminDtos.RoleRefResponse> roles) {}
}
