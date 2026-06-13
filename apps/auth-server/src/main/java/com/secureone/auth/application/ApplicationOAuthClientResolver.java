package com.secureone.auth.application;

import com.secureone.auth.util.JsonMaps;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Resolves integrated applications from OAuth client identifiers. */
@Service
@Transactional(readOnly = true)
public class ApplicationOAuthClientResolver {

    private final ApplicationRepository applications;

    public ApplicationOAuthClientResolver(ApplicationRepository applications) {
        this.applications = applications;
    }

    public Optional<Application> findActiveByOAuthClientId(String clientId) {
        if (clientId == null || clientId.isBlank()) {
            return Optional.empty();
        }
        String normalized = clientId.trim();
        return applications.findAll().stream()
                .filter(this::isActive)
                .filter(app -> normalized.equals(resolveOAuthClientId(app)))
                .findFirst();
    }

    private boolean isActive(Application app) {
        return "ACTIVE".equalsIgnoreCase(app.getStatus());
    }

    static String resolveOAuthClientId(Application app) {
        Map<String, Object> config = app.getConfig() != null ? app.getConfig() : Map.of();
        String clientId = JsonMaps.stringVal(config, "clientId", app.getSlug());
        return clientId != null && !clientId.isBlank() ? clientId.trim() : app.getSlug();
    }
}
