package com.secureone.auth.admin.application;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class ApplicationAdminDtos {

    private ApplicationAdminDtos() {}

    public record ApplicationResponse(
            UUID id,
            UUID tenantId,
            String name,
            String clientId,
            String type,
            String status,
            List<String> grantTypes,
            List<String> scopes,
            List<String> redirectUris,
            Instant createdAt) {}

    public record ApplicationCreateRequest(
            @NotNull UUID tenantId,
            @NotBlank @Size(max = 255) String name,
            @Size(max = 100) String clientId,
            @Size(max = 32) String type,
            @Size(max = 32) String status,
            List<String> grantTypes,
            List<String> scopes,
            List<String> redirectUris) {}

    public record ApplicationUpdateRequest(
            @NotBlank @Size(max = 255) String name,
            @Size(max = 32) String type,
            @Size(max = 32) String status,
            List<String> grantTypes,
            List<String> scopes,
            List<String> redirectUris) {}
}
