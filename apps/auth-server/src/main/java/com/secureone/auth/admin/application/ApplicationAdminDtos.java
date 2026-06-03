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
            String description,
            String clientId,
            String type,
            String status,
            List<String> grantTypes,
            List<String> scopes,
            List<String> redirectUris,
            List<String> postLogoutRedirectUris,
            boolean confidential,
            boolean pkceRequired,
            String tokenEndpointAuthMethod,
            boolean clientSecretConfigured,
            Instant createdAt,
            Instant updatedAt,
            OAuthEndpoints oAuthEndpoints) {}

    /** Returned once when a confidential client is created or its secret is rotated. */
    public record ApplicationSecretResponse(String clientSecret) {}

    public record OAuthEndpoints(String issuer, String authorizationEndpoint, String tokenEndpoint, String jwksUri) {}

    public record ApplicationCreateRequest(
            @NotNull UUID tenantId,
            @NotBlank @Size(max = 255) String name,
            @Size(max = 2000) String description,
            @Size(max = 100) String clientId,
            @Size(max = 32) String type,
            @Size(max = 32) String status,
            List<String> grantTypes,
            List<String> scopes,
            List<String> redirectUris,
            List<String> postLogoutRedirectUris,
            Boolean pkceRequired,
            @Size(max = 64) String tokenEndpointAuthMethod) {}

    public record ApplicationUpdateRequest(
            @NotBlank @Size(max = 255) String name,
            @Size(max = 2000) String description,
            @Size(max = 32) String type,
            @Size(max = 32) String status,
            List<String> grantTypes,
            List<String> scopes,
            List<String> redirectUris,
            List<String> postLogoutRedirectUris,
            Boolean pkceRequired,
            @Size(max = 64) String tokenEndpointAuthMethod) {}

    public record ApplicationCreateResult(ApplicationResponse application, String clientSecret) {}
}
