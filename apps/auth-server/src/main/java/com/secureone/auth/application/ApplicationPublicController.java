package com.secureone.auth.application;

import com.secureone.auth.application.ApplicationAccountDtos.EmailRequest;
import com.secureone.auth.application.ApplicationAccountDtos.SessionLoginRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;

/**
 * Unauthenticated application manifest for client apps (login UI, mobile SDK, etc.).
 * Response contents are configured per application under Settings → Public API.
 */
@Tag(name = "Application public API", description = "Manifest and self-service sign-up for integrated apps")
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
@RestController
@RequestMapping("/api/v1/applications")
public class ApplicationPublicController {

    private final ApplicationPublicManifestService manifest;
    private final ApplicationSignupService signup;
    private final ApplicationPublicAccountService account;

    public ApplicationPublicController(
            ApplicationPublicManifestService manifest,
            ApplicationSignupService signup,
            ApplicationPublicAccountService account) {
        this.manifest = manifest;
        this.signup = signup;
        this.account = account;
    }

    @GetMapping("/{applicationId}")
    public Map<String, Object> getManifest(@PathVariable UUID applicationId) {
        return manifest.getPublicManifest(applicationId);
    }

    /** Whether self-service sign-up is available (for integrated apps such as e-commerce clients). */
    @GetMapping("/{applicationId}/signup")
    public Map<String, Object> signupOptions(@PathVariable UUID applicationId) {
        return signup.signupOptions(applicationId);
    }

    @PostMapping("/{applicationId}/signup")
    public Map<String, Object> signup(
            @PathVariable UUID applicationId, @Valid @RequestBody ApplicationSignupDtos.SignupRequest body) {
        return signup.register(applicationId, body);
    }

    @PostMapping("/{applicationId}/account/password/forgot")
    public Map<String, String> forgotPassword(
            @PathVariable UUID applicationId, @Valid @RequestBody EmailRequest body) {
        return account.forgotPassword(applicationId, body.email());
    }

    @PostMapping("/{applicationId}/account/email/resend-verification")
    public Map<String, String> resendVerification(
            @PathVariable UUID applicationId, @Valid @RequestBody EmailRequest body) {
        return account.resendVerification(applicationId, body.email());
    }

    @PostMapping("/{applicationId}/account/magic-link/request")
    public Map<String, String> requestMagicLink(
            @PathVariable UUID applicationId, @Valid @RequestBody EmailRequest body) {
        return account.requestMagicLink(applicationId, body.email());
    }

    @PostMapping("/{applicationId}/auth/session/login")
    public ResponseEntity<?> sessionLogin(
            @PathVariable UUID applicationId,
            @Valid @RequestBody SessionLoginRequest body,
            HttpServletRequest request,
            HttpServletResponse response) {
        return account.sessionLogin(applicationId, body.email(), body.password(), request, response);
    }
}
