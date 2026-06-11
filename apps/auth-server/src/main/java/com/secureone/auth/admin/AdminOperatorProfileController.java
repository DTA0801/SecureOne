package com.secureone.auth.admin;

import com.secureone.auth.account.UserPasswordService;
import com.secureone.auth.user.UserAccount;
import com.secureone.auth.user.UserAccountRepository;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Admin — operator profile", description = "Signed-in admin console user profile and password")
@SecurityRequirement(name = "adminHttpBasic")
@RestController
@RequestMapping("/api/admin/v1/me")
public class AdminOperatorProfileController {

    private final AdminAccessService access;
    private final AdminOperatorService operators;
    private final UserPasswordService passwords;
    private final UserAccountRepository users;

    public AdminOperatorProfileController(
            AdminAccessService access,
            AdminOperatorService operators,
            UserPasswordService passwords,
            UserAccountRepository users) {
        this.access = access;
        this.operators = operators;
        this.passwords = passwords;
        this.users = users;
    }

    public record OperatorProfileResponse(
            String operatorTier,
            boolean platformSuperAdmin,
            String principal,
            UUID userId,
            UUID tenantId,
            String tenantSlug,
            String tenantName,
            String email,
            String username,
            String displayName,
            boolean emailVerified,
            boolean hasPassword,
            String status,
            Instant createdAt) {}

    public record OperatorProfileUpdateRequest(
            @Size(max = 150) String username,
            @Size(max = 150) String displayName) {}

    public record OperatorPasswordChangeRequest(
            @NotBlank String currentPassword,
            @NotBlank @Size(min = 8, max = 128) String newPassword) {}

    @GetMapping
    public OperatorProfileResponse profile(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail) {
        boolean superAdmin = access.canAccessPlatformSettings(authentication, actAsEmail);
        String tier = access.resolveOperatorTier(authentication, actAsEmail);
        if (superAdmin) {
            return new OperatorProfileResponse(
                    tier,
                    true,
                    authentication != null ? authentication.getName() : "admin",
                    null,
                    null,
                    null,
                    null,
                    null,
                    authentication != null ? authentication.getName() : "admin",
                    authentication != null ? authentication.getName() : "Platform admin",
                    true,
                    true,
                    "ACTIVE",
                    null);
        }
        UserAccount user = operators
                .resolveTenantUser(authentication, actAsEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Operator account not found"));
        var tenant = operators.requireOperatorTenant(authentication, actAsEmail);
        return new OperatorProfileResponse(
                tier,
                false,
                authentication.getName(),
                user.getId(),
                tenant.getId(),
                tenant.getSlug(),
                tenant.getName(),
                user.getEmail(),
                user.getUsername(),
                user.getDisplayName(),
                user.isEmailVerified(),
                passwords.hasPassword(user.getId()),
                user.getStatus(),
                user.getCreatedAt());
    }

    @PatchMapping
    public OperatorProfileResponse updateProfile(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @RequestBody OperatorProfileUpdateRequest body) {
        if (access.canAccessPlatformSettings(authentication, actAsEmail)) {
            return profile(authentication, actAsEmail);
        }
        UserAccount user = operators
                .resolveTenantUser(authentication, actAsEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Operator account not found"));
        if (body.username() != null && !body.username().isBlank()) {
            user.setUsername(body.username().trim());
        }
        if (body.displayName() != null && !body.displayName().isBlank()) {
            user.setDisplayName(body.displayName().trim());
        }
        users.save(user);
        return profile(authentication, actAsEmail);
    }

    @PostMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail,
            @RequestBody OperatorPasswordChangeRequest body) {
        if (access.canAccessPlatformSettings(authentication, actAsEmail)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Platform super-admin password is configured via server settings (admin / SECUREONE_DEV_PASSWORD).");
        }
        UserAccount user = operators
                .resolveTenantUser(authentication, actAsEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Operator account not found"));
        UUID appId = access.accessibleApplications(authentication, actAsEmail).stream()
                .findFirst()
                .map(AdminAccessService.ApplicationSummary::id)
                .orElse(null);
        passwords.changePassword(user.getId(), body.currentPassword(), body.newPassword(), appId);
    }
}
