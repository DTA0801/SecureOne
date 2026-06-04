package com.secureone.auth.admin.user;

import com.secureone.auth.admin.application.ApplicationUserAdminService;
import com.secureone.auth.admin.user.UserAdminDtos.UserCreateRequest;
import com.secureone.auth.admin.user.UserAdminDtos.UserResponse;
import com.secureone.auth.admin.user.UserAdminDtos.UserUpdateRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Admin — users", description = "Platform-wide user directory")
@SecurityRequirement(name = "adminHttpBasic")
@RestController
@RequestMapping("/api/admin/v1/users")
public class UserAdminController {

    private final UserAdminService service;
    private final ApplicationUserAdminService applicationUsers;

    public UserAdminController(UserAdminService service, ApplicationUserAdminService applicationUsers) {
        this.service = service;
        this.applicationUsers = applicationUsers;
    }

    @GetMapping
    public List<UserResponse> list(
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID applicationId,
            @RequestParam(required = false) Boolean adminOnly) {
        if (applicationId != null) {
            return applicationUsers.listUsers(applicationId);
        }
        if (Boolean.TRUE.equals(adminOnly)) {
            return service.listWithAdminRole(tenantId);
        }
        if (tenantId != null) {
            return service.listByTenant(tenantId);
        }
        return service.list();
    }

    @GetMapping("/{id}")
    public UserResponse get(@PathVariable UUID id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse create(@Valid @RequestBody UserCreateRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public UserResponse update(@PathVariable UUID id, @Valid @RequestBody UserUpdateRequest request) {
        return service.update(id, request);
    }

    @PatchMapping("/{id}/status")
    public UserResponse setStatus(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        return service.setStatus(id, body.get("status"));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }

    @PostMapping("/{id}/password/reset-email")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public Map<String, String> sendPasswordResetEmail(@PathVariable UUID id) {
        service.sendPasswordResetEmail(id);
        return Map.of("status", "sent", "message", "Password reset email sent to the user.");
    }

    @PostMapping("/{id}/email/resend-verification")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public Map<String, String> resendVerification(@PathVariable UUID id) {
        service.resendVerificationEmail(id);
        return Map.of("status", "sent", "message", "Verification email sent to the user.");
    }

    @PostMapping("/{id}/email/verify")
    public UserResponse markEmailVerified(@PathVariable UUID id) {
        return service.markEmailVerified(id);
    }

    @PostMapping("/{id}/mfa/reset")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetMfa(@PathVariable UUID id) {
        service.resetMfa(id);
    }

    @PostMapping("/{id}/unlock")
    public UserResponse unlock(@PathVariable UUID id) {
        return service.unlockAccount(id);
    }

    @PostMapping("/{id}/password/set")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void adminSetPassword(
            @PathVariable UUID id, @Valid @RequestBody UserAdminDtos.AdminSetPasswordRequest request) {
        service.adminSetPassword(id, request.password());
    }
}
