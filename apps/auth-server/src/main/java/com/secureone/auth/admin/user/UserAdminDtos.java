package com.secureone.auth.admin.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class UserAdminDtos {

    private UserAdminDtos() {}

    public record MfaFactorResponse(String id, String type, String label, boolean verified) {}

    public record UserResponse(
            UUID id,
            UUID tenantId,
            String email,
            String username,
            String firstName,
            String lastName,
            String status,
            boolean emailVerified,
            List<String> roleIds,
            List<MfaFactorResponse> mfaFactors,
            Instant lastLoginAt,
            Instant createdAt) {}

    public record UserCreateRequest(
            @NotNull UUID tenantId,
            @NotBlank @Email String email,
            @Size(max = 150) String username,
            @Size(max = 150) String firstName,
            @Size(max = 150) String lastName,
            @Size(max = 32) String status,
            List<UUID> roleIds) {}

    public record UserUpdateRequest(
            @NotBlank @Email String email,
            @Size(max = 150) String username,
            @Size(max = 150) String firstName,
            @Size(max = 150) String lastName,
            @Size(max = 32) String status,
            List<UUID> roleIds) {}
}
