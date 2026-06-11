package com.secureone.auth.config.oauth;

import com.secureone.auth.application.Application;
import com.secureone.auth.application.ApplicationRepository;
import com.secureone.auth.util.JsonMaps;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.settings.ClientSettings;
import org.springframework.security.oauth2.server.authorization.settings.OAuth2TokenFormat;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Loads OAuth clients from application records (admin-registered OAuth apps). */
@Service
@Transactional(readOnly = true)
public class ApplicationRegisteredClientRepository implements RegisteredClientRepository {

    private final ApplicationRepository applications;
    private final PasswordEncoder passwordEncoder;

    public ApplicationRegisteredClientRepository(
            ApplicationRepository applications, PasswordEncoder passwordEncoder) {
        this.applications = applications;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void save(RegisteredClient registeredClient) {
        throw new UnsupportedOperationException(
                "OAuth clients are managed via the admin Applications API.");
    }

    @Override
    public RegisteredClient findById(String id) {
        try {
            return applications
                    .findById(UUID.fromString(id))
                    .filter(this::isActive)
                    .map(this::toRegisteredClient)
                    .orElse(null);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    @Override
    public RegisteredClient findByClientId(String clientId) {
        if (clientId == null || clientId.isBlank()) {
            return null;
        }
        String normalized = clientId.trim();
        return applications.findAll().stream()
                .filter(this::isActive)
                .filter(app -> normalized.equals(resolveClientId(app)))
                .map(this::toRegisteredClient)
                .findFirst()
                .orElse(null);
    }

    private boolean isActive(Application app) {
        return "ACTIVE".equalsIgnoreCase(app.getStatus());
    }

    private RegisteredClient toRegisteredClient(Application app) {
        Map<String, Object> config = app.getConfig() != null ? app.getConfig() : Map.of();
        String clientId = resolveClientId(app);
        String type = JsonMaps.stringVal(config, "type", "web").toLowerCase(Locale.ROOT);
        boolean pkceRequired = JsonMaps.boolVal(config, "pkceRequired", !"m2m".equals(type));
        String authMethod = JsonMaps.stringVal(config, "tokenEndpointAuthMethod", defaultAuthMethod(type));
        boolean publicClient = "none".equalsIgnoreCase(authMethod);

        RegisteredClient.Builder builder = RegisteredClient.withId(app.getId().toString())
                .clientId(clientId)
                .clientName(app.getName());

        for (String grant : JsonMaps.stringList(config, "grantTypes")) {
            mapGrantType(grant).ifPresent(builder::authorizationGrantType);
        }
        if (JsonMaps.stringList(config, "grantTypes").isEmpty()) {
            builder.authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE);
            builder.authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN);
        }

        for (String uri : JsonMaps.stringList(config, "redirectUris")) {
            if (!uri.isBlank()) {
                builder.redirectUri(uri.trim());
            }
        }
        for (String uri : JsonMaps.stringList(config, "postLogoutRedirectUris")) {
            if (!uri.isBlank()) {
                builder.postLogoutRedirectUri(uri.trim());
            }
        }

        List<String> scopes = JsonMaps.stringList(config, "scopes");
        if (scopes.isEmpty()) {
            builder.scope("openid").scope("profile").scope("email");
        } else {
            scopes.forEach(builder::scope);
        }

        if (publicClient) {
            builder.clientAuthenticationMethod(ClientAuthenticationMethod.NONE);
        } else {
            builder.clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC);
            builder.clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST);
            String secret = JsonMaps.stringVal(config, "clientSecret", "");
            if (!secret.isBlank()) {
                builder.clientSecret(encodeSecret(secret));
            }
        }

        builder.clientSettings(ClientSettings.builder()
                .requireAuthorizationConsent(false)
                .requireProofKey(pkceRequired)
                .build());
        builder.tokenSettings(TokenSettings.builder()
                .accessTokenFormat(OAuth2TokenFormat.SELF_CONTAINED)
                .build());

        return builder.build();
    }

    private String resolveClientId(Application app) {
        Map<String, Object> config = app.getConfig() != null ? app.getConfig() : Map.of();
        String clientId = JsonMaps.stringVal(config, "clientId", app.getSlug());
        return clientId != null && !clientId.isBlank() ? clientId.trim() : app.getSlug();
    }

    private String encodeSecret(String secret) {
        if (secret.startsWith("{bcrypt}") || secret.startsWith("$2a$") || secret.startsWith("$2b$")) {
            return secret.startsWith("{bcrypt}") ? secret : "{bcrypt}" + secret;
        }
        return passwordEncoder.encode(secret);
    }

    private static String defaultAuthMethod(String type) {
        return "m2m".equals(type) || "web".equals(type) ? "client_secret_basic" : "none";
    }

    private static java.util.Optional<AuthorizationGrantType> mapGrantType(String grant) {
        if (grant == null) {
            return java.util.Optional.empty();
        }
        return switch (grant.trim().toLowerCase(Locale.ROOT)) {
            case "authorization_code" -> java.util.Optional.of(AuthorizationGrantType.AUTHORIZATION_CODE);
            case "refresh_token" -> java.util.Optional.of(AuthorizationGrantType.REFRESH_TOKEN);
            case "client_credentials" -> java.util.Optional.of(AuthorizationGrantType.CLIENT_CREDENTIALS);
            default -> java.util.Optional.empty();
        };
    }
}
