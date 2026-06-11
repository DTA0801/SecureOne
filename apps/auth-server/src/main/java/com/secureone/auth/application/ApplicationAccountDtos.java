package com.secureone.auth.application;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class ApplicationAccountDtos {

    private ApplicationAccountDtos() {}

    public record EmailRequest(@NotBlank @Email String email) {}

    public record SessionLoginRequest(
            @NotBlank @Email String email, @NotBlank @Size(min = 1, max = 128) String password) {}
}
