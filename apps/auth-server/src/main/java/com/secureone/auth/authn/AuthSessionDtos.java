package com.secureone.auth.authn;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthSessionDtos {

    private AuthSessionDtos() {}

    /**
     * @deprecated Prefer {@code POST /api/v1/applications/{applicationId}/auth/session/login} with email
     *     and password only.
     */
    @Deprecated
    public record SessionLoginRequest(
            String tenantSlug,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 1, max = 128) String password,
            java.util.UUID applicationId) {}
}
