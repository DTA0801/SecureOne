package com.secureone.auth.admin;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Admin — auth", description = "Admin console login (JSON body, no HTTP Basic colon issues)")
@RestController
@RequestMapping("/api/admin/v1/auth")
public class AdminAuthController {

    private final AuthenticationManager authenticationManager;
    private final AdminAccessService access;

    public AdminAuthController(AuthenticationManager authenticationManager, AdminAccessService access) {
        this.authenticationManager = authenticationManager;
        this.access = access;
    }

    public record AdminLoginRequest(String tenantSlug, String emailOrUsername, String password) {}

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AdminLoginRequest body) {
        if (body.emailOrUsername() == null
                || body.emailOrUsername().isBlank()
                || body.password() == null) {
            return ResponseEntity.badRequest().body(java.util.Map.of("detail", "Username and password are required."));
        }
        String username = resolveUsername(body.tenantSlug(), body.emailOrUsername());
        try {
            Authentication auth =
                    authenticationManager.authenticate(
                            new UsernamePasswordAuthenticationToken(username, body.password()));
            var apps = access.accessibleApplications(auth, null);
            if (apps.isEmpty() && username.contains(":")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(java.util.Map.of(
                                "detail", "Signed in, but no applications are assigned to this account."));
            }
            return ResponseEntity.ok(java.util.Map.of(
                    "ok", true,
                    "principal", auth.getName(),
                    "platformSuperAdmin", access.canAccessPlatformSettings(auth, null)));
        } catch (AuthenticationException ex) {
            String detail = ex.getMessage();
            if (detail == null || detail.isBlank()) {
                detail = "Invalid credentials.";
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(java.util.Map.of("detail", detail));
        }
    }

    private static String resolveUsername(String tenantSlug, String emailOrUsername) {
        String value = emailOrUsername.trim();
        if (tenantSlug == null || tenantSlug.isBlank()) {
            return value;
        }
        return tenantSlug.trim().toLowerCase() + ":" + value.toLowerCase();
    }
}
