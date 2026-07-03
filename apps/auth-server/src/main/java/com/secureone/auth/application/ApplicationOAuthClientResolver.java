package com.secureone.auth.application;

import com.secureone.auth.oauth.OAuthClient;
import com.secureone.auth.oauth.OAuthClientRepository;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Resolves integrated applications from OAuth client identifiers. */
@Service
@Transactional(readOnly = true)
public class ApplicationOAuthClientResolver {

    private final OAuthClientRepository oauthClients;
    private final ApplicationRepository applications;

    public ApplicationOAuthClientResolver(
            OAuthClientRepository oauthClients, ApplicationRepository applications) {
        this.oauthClients = oauthClients;
        this.applications = applications;
    }

    public Optional<Application> findActiveByOAuthClientId(String clientId) {
        if (clientId == null || clientId.isBlank()) {
            return Optional.empty();
        }
        return oauthClients
                .findByClientId(clientId.trim())
                .filter(this::isActiveClient)
                .flatMap(client -> applications.findById(client.getApplicationId()))
                .filter(this::isActiveApplication);
    }

    private boolean isActiveClient(OAuthClient client) {
        return "ACTIVE".equalsIgnoreCase(client.getStatus());
    }

    private boolean isActiveApplication(Application app) {
        return "ACTIVE".equalsIgnoreCase(app.getStatus());
    }
}
