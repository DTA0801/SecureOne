package com.secureone.auth.account;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AccountDtos {

    private AccountDtos() {}

    public record TenantEmailRequest(
            @NotBlank String tenantSlug, @NotBlank @Email String email) {}

    public record ResetPasswordRequest(
            @NotBlank String token, @NotBlank @Size(min = 8, max = 128) String password) {}
}
