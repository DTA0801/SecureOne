package com.secureone.auth.application;

import java.util.Map;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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

    public ApplicationPublicController(ApplicationPublicManifestService manifest) {
        this.manifest = manifest;
    }

    @GetMapping("/{applicationId}")
    public Map<String, Object> getManifest(@PathVariable UUID applicationId) {
        return manifest.getPublicManifest(applicationId);
    }
}
