package com.secureone.auth.application;

import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Unauthenticated application manifest for client apps (login UI, mobile SDK, etc.).
 * Response contents are configured per application under Settings → Public API.
 */
@RestController
@RequestMapping("/api/v1/applications")
public class ApplicationPublicController {

    private final ApplicationPublicManifestService manifest;
    private final ApplicationSignupService signup;

    public ApplicationPublicController(
            ApplicationPublicManifestService manifest, ApplicationSignupService signup) {
        this.manifest = manifest;
        this.signup = signup;
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
}
