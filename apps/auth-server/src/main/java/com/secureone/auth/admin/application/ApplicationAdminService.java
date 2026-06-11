package com.secureone.auth.admin.application;

import com.secureone.auth.admin.ConflictException;
import com.secureone.auth.admin.ResourceNotFoundException;
import com.secureone.auth.admin.application.ApplicationAdminDtos.ApplicationCreateRequest;
import com.secureone.auth.admin.application.ApplicationAdminDtos.ApplicationCreateResult;
import com.secureone.auth.admin.application.ApplicationAdminDtos.ApplicationResponse;
import com.secureone.auth.admin.application.ApplicationAdminDtos.ApplicationSecretResponse;
import com.secureone.auth.admin.application.ApplicationAdminDtos.ApplicationUpdateRequest;
import com.secureone.auth.admin.application.ApplicationAdminDtos.OAuthEndpoints;
import com.secureone.auth.application.Application;
import com.secureone.auth.application.ApplicationRepository;
import com.secureone.auth.audit.AuditService;
import com.secureone.auth.notify.EmailNotificationService;
import com.secureone.auth.rbac.RbacBootstrapService;
import com.secureone.auth.tenant.TenantRepository;
import com.secureone.auth.util.JsonMaps;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ApplicationAdminService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final ApplicationRepository applicationRepository;
    private final TenantRepository tenantRepository;
    private final AuditService auditService;
    private final EmailNotificationService emailService;
    private final RbacBootstrapService rbacBootstrap;
    private final String issuerBaseUrl;

    public ApplicationAdminService(
            ApplicationRepository applicationRepository,
            TenantRepository tenantRepository,
            AuditService auditService,
            EmailNotificationService emailService,
            RbacBootstrapService rbacBootstrap,
            @Value("${secureone.issuer:http://localhost:9000}") String issuerBaseUrl) {
        this.applicationRepository = applicationRepository;
        this.tenantRepository = tenantRepository;
        this.auditService = auditService;
        this.emailService = emailService;
        this.rbacBootstrap = rbacBootstrap;
        this.issuerBaseUrl = issuerBaseUrl.endsWith("/") ? issuerBaseUrl.substring(0, issuerBaseUrl.length() - 1) : issuerBaseUrl;
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> list() {
        return applicationRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> listByTenant(UUID tenantId) {
        requireTenant(tenantId);
        return applicationRepository.findByTenantIdOrderByCreatedAtDesc(tenantId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ApplicationResponse get(UUID id) {
        return toResponse(require(id));
    }

    public ApplicationCreateResult create(ApplicationCreateRequest request) {
        requireTenant(request.tenantId());
        String slug = slugify(request.clientId() != null ? request.clientId() : request.name());
        if (applicationRepository.findByTenantIdAndSlug(request.tenantId(), slug).isPresent()) {
            throw new ConflictException("Application slug already exists for tenant: " + slug);
        }
        String type = normalizeType(request.type());
        Application app = new Application();
        app.setTenantId(request.tenantId());
        app.setName(request.name().trim());
        app.setDescription(trimOrNull(request.description()));
        app.setSlug(slug);
        app.setStatus(normalizeStatus(request.status(), "ACTIVE"));
        Map<String, Object> config = buildConfig(
                type,
                request.clientId(),
                slug,
                request.grantTypes(),
                request.scopes(),
                request.redirectUris(),
                request.postLogoutRedirectUris(),
                request.pkceRequired(),
                request.tokenEndpointAuthMethod());
        String plainSecret = null;
        if (isConfidential(type)) {
            plainSecret = generateClientSecret();
            config.put("clientSecret", plainSecret);
        }
        app.setConfig(config);
        applicationRepository.save(app);
        rbacBootstrap.seedDefaultRoles(request.tenantId(), app.getId());
        auditService.record(
                request.tenantId(), "admin", "application.created", "application", app.getId(), app.getName(), true);
        emailService.sendAdminNotification(app.getId(), "Application registered", "New OAuth client: " + app.getName());
        return new ApplicationCreateResult(toResponse(app), plainSecret);
    }

    public ApplicationResponse update(UUID id, ApplicationUpdateRequest request) {
        Application app = require(id);
        app.setName(request.name().trim());
        app.setDescription(trimOrNull(request.description()));
        app.setStatus(normalizeStatus(request.status(), app.getStatus()));
        Map<String, Object> config = new HashMap<>(app.getConfig() != null ? app.getConfig() : Map.of());
        String type = request.type() != null ? normalizeType(request.type()) : JsonMaps.stringVal(config, "type", "web");
        config.put("type", type);
        if (request.grantTypes() != null) config.put("grantTypes", request.grantTypes());
        if (request.scopes() != null) config.put("scopes", request.scopes());
        if (request.redirectUris() != null) config.put("redirectUris", request.redirectUris());
        if (request.postLogoutRedirectUris() != null) config.put("postLogoutRedirectUris", request.postLogoutRedirectUris());
        if (request.pkceRequired() != null) config.put("pkceRequired", request.pkceRequired());
        if (request.tokenEndpointAuthMethod() != null) {
            config.put("tokenEndpointAuthMethod", request.tokenEndpointAuthMethod());
        } else if (!config.containsKey("tokenEndpointAuthMethod")) {
            config.put("tokenEndpointAuthMethod", defaultAuthMethod(type));
        }
        app.setConfig(config);
        auditService.record(
                app.getTenantId(), "admin", "application.updated", "application", app.getId(), app.getName(), true);
        return toResponse(app);
    }

    public ApplicationSecretResponse rotateClientSecret(UUID id) {
        Application app = require(id);
        Map<String, Object> config = new HashMap<>(app.getConfig() != null ? app.getConfig() : Map.of());
        String type = JsonMaps.stringVal(config, "type", "web");
        if (!isConfidential(type)) {
            throw new IllegalArgumentException("Public clients (SPA/native) do not use a client secret.");
        }
        String plainSecret = generateClientSecret();
        config.put("clientSecret", plainSecret);
        app.setConfig(config);
        auditService.record(
                app.getTenantId(),
                "admin",
                "application.secret_rotated",
                "application",
                app.getId(),
                app.getName(),
                true);
        emailService.sendAdminNotification(id, "Client secret rotated", "OAuth client: " + app.getName());
        return new ApplicationSecretResponse(plainSecret);
    }

    public void delete(UUID id) {
        Application app = require(id);
        applicationRepository.delete(app);
        auditService.record(
                app.getTenantId(), "admin", "application.deleted", "application", id, app.getName(), true);
        emailService.sendAdminNotification(id, "Application deleted", "Removed application: " + app.getName());
    }

    private Application require(UUID id) {
        return applicationRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found: " + id));
    }

    private void requireTenant(UUID tenantId) {
        if (!tenantRepository.existsById(tenantId)) {
            throw new ResourceNotFoundException("Tenant not found: " + tenantId);
        }
    }

    private ApplicationResponse toResponse(Application app) {
        Map<String, Object> config = app.getConfig() != null ? app.getConfig() : Map.of();
        String type = JsonMaps.stringVal(config, "type", "web");
        boolean confidential = isConfidential(type);
        return new ApplicationResponse(
                app.getId(),
                app.getTenantId(),
                app.getName(),
                app.getDescription(),
                JsonMaps.stringVal(config, "clientId", app.getSlug()),
                type,
                app.getStatus().toLowerCase(Locale.ROOT),
                JsonMaps.stringList(config, "grantTypes"),
                JsonMaps.stringList(config, "scopes"),
                JsonMaps.stringList(config, "redirectUris"),
                JsonMaps.stringList(config, "postLogoutRedirectUris"),
                confidential,
                JsonMaps.boolVal(config, "pkceRequired", defaultPkceRequired(type)),
                JsonMaps.stringVal(config, "tokenEndpointAuthMethod", defaultAuthMethod(type)),
                confidential && config.containsKey("clientSecret"),
                app.getCreatedAt(),
                app.getUpdatedAt(),
                oAuthEndpoints());
    }

    private OAuthEndpoints oAuthEndpoints() {
        return new OAuthEndpoints(
                issuerBaseUrl,
                issuerBaseUrl + "/oauth2/authorize",
                issuerBaseUrl + "/oauth2/token",
                issuerBaseUrl + "/oauth2/jwks");
    }

    private static Map<String, Object> buildConfig(
            String type,
            String clientId,
            String slug,
            List<String> grantTypes,
            List<String> scopes,
            List<String> redirectUris,
            List<String> postLogoutRedirectUris,
            Boolean pkceRequired,
            String tokenEndpointAuthMethod) {
        Map<String, Object> config = new HashMap<>();
        config.put("type", type);
        config.put("clientId", clientId != null && !clientId.isBlank() ? clientId.trim() : slug);
        config.put("grantTypes", grantTypes != null && !grantTypes.isEmpty() ? grantTypes : defaultGrantTypes(type));
        config.put("scopes", scopes != null && !scopes.isEmpty() ? scopes : defaultScopes(type));
        config.put("redirectUris", redirectUris != null ? redirectUris : List.of());
        config.put("postLogoutRedirectUris", postLogoutRedirectUris != null ? postLogoutRedirectUris : List.of());
        config.put("pkceRequired", pkceRequired != null ? pkceRequired : defaultPkceRequired(type));
        config.put(
                "tokenEndpointAuthMethod",
                tokenEndpointAuthMethod != null && !tokenEndpointAuthMethod.isBlank()
                        ? tokenEndpointAuthMethod
                        : defaultAuthMethod(type));
        return config;
    }

    private static List<String> defaultGrantTypes(String type) {
        return switch (type) {
            case "m2m" -> List.of("client_credentials");
            case "spa", "native" -> List.of("authorization_code", "refresh_token");
            default -> List.of("authorization_code", "refresh_token");
        };
    }

    private static List<String> defaultScopes(String type) {
        return "m2m".equals(type) ? List.of() : List.of("openid", "profile", "email");
    }

    private static boolean defaultPkceRequired(String type) {
        return !"m2m".equals(type);
    }

    private static String defaultAuthMethod(String type) {
        return isConfidential(type) ? "client_secret_basic" : "none";
    }

    private static boolean isConfidential(String type) {
        return "web".equals(type) || "m2m".equals(type);
    }

    private static String normalizeType(String type) {
        if (type == null || type.isBlank()) return "web";
        return switch (type.trim().toLowerCase(Locale.ROOT)) {
            case "spa", "native", "m2m", "web" -> type.trim().toLowerCase(Locale.ROOT);
            default -> "web";
        };
    }

    private static String normalizeStatus(String status, String defaultStatus) {
        if (status == null || status.isBlank()) return defaultStatus;
        return switch (status.trim().toLowerCase(Locale.ROOT)) {
            case "active" -> "ACTIVE";
            case "disabled" -> "DISABLED";
            case "suspended" -> "SUSPENDED";
            default -> status.trim().toUpperCase(Locale.ROOT);
        };
    }

    private static String slugify(String value) {
        return value.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    }

    private static String trimOrNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    private static String generateClientSecret() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
