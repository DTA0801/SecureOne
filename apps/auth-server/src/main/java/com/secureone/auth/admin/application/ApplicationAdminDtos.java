package com.secureone.auth.admin.application;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

public final class ApplicationAdminDtos {

    private ApplicationAdminDtos() {}

    public record ApplicationResponse(
            UUID id,
            UUID tenantId,
            String name,
            String slug,
            String description,
            String status,
            String schemaName,
            long oauthClientCount,
            Instant createdAt,
            Instant updatedAt) {}

    public record ApplicationCreateRequest(
            @NotNull UUID tenantId,
            @NotBlank @Size(max = 255) String name,
            @Size(max = 2000) String description,
            @Size(max = 100) String slug,
            @Size(max = 32) String status) {}

    public record ApplicationUpdateRequest(
            @NotBlank @Size(max = 255) String name,
            @Size(max = 2000) String description,
            @Size(max = 32) String status) {}
}
