package com.secureone.auth.admin.application;

import com.secureone.auth.admin.ConflictException;
import com.secureone.auth.admin.ResourceNotFoundException;
import com.secureone.auth.admin.application.ApplicationAdminDtos.ApplicationCreateRequest;
import com.secureone.auth.admin.application.ApplicationAdminDtos.ApplicationResponse;
import com.secureone.auth.admin.application.ApplicationAdminDtos.ApplicationUpdateRequest;
import com.secureone.auth.application.Application;
import com.secureone.auth.application.ApplicationRepository;
import com.secureone.auth.audit.AuditService;
import com.secureone.auth.notify.EmailNotificationService;
import com.secureone.auth.rbac.RbacBootstrapService;
import com.secureone.auth.tenant.TenantRepository;
import com.secureone.auth.util.JsonMaps;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ApplicationAdminService {

    private final ApplicationRepository applicationRepository;
    private final TenantRepository tenantRepository;
    private final AuditService auditService;
    private final EmailNotificationService emailService;
    private final RbacBootstrapService rbacBootstrap;

    public ApplicationAdminService(
            ApplicationRepository applicationRepository,
            TenantRepository tenantRepository,
            AuditService auditService,
            EmailNotificationService emailService,
            RbacBootstrapService rbacBootstrap) {
        this.applicationRepository = applicationRepository;
        this.tenantRepository = tenantRepository;
        this.auditService = auditService;
        this.emailService = emailService;
        this.rbacBootstrap = rbacBootstrap;
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

    public ApplicationResponse create(ApplicationCreateRequest request) {
        requireTenant(request.tenantId());
        String slug = slugify(request.clientId() != null ? request.clientId() : request.name());
        if (applicationRepository.findByTenantIdAndSlug(request.tenantId(), slug).isPresent()) {
            throw new ConflictException("Application slug already exists for tenant: " + slug);
        }
        Application app = new Application();
        app.setTenantId(request.tenantId());
        app.setName(request.name().trim());
        app.setSlug(slug);
        app.setStatus(normalizeStatus(request.status(), "ACTIVE"));
        app.setConfig(buildConfig(request.type(), request.clientId(), slug, request.grantTypes(), request.scopes(), request.redirectUris()));
        applicationRepository.save(app);
        rbacBootstrap.seedDefaultPermissions(app.getId());
        auditService.record(request.tenantId(), "admin", "application.created", "application", app.getId(), app.getName(), true);
        emailService.sendAdminNotification("Application registered", "New application: " + app.getName());
        return toResponse(app);
    }

    public ApplicationResponse update(UUID id, ApplicationUpdateRequest request) {
        Application app = require(id);
        app.setName(request.name().trim());
        app.setStatus(normalizeStatus(request.status(), app.getStatus()));
        Map<String, Object> config = new HashMap<>(app.getConfig());
        if (request.type() != null) config.put("type", request.type());
        if (request.grantTypes() != null) config.put("grantTypes", request.grantTypes());
        if (request.scopes() != null) config.put("scopes", request.scopes());
        if (request.redirectUris() != null) config.put("redirectUris", request.redirectUris());
        app.setConfig(config);
        auditService.record(app.getTenantId(), "admin", "application.updated", "application", app.getId(), app.getName(), true);
        return toResponse(app);
    }

    public void delete(UUID id) {
        Application app = require(id);
        applicationRepository.delete(app);
        auditService.record(app.getTenantId(), "admin", "application.deleted", "application", id, app.getName(), true);
        emailService.sendAdminNotification("Application deleted", "Removed application: " + app.getName());
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
        return new ApplicationResponse(
                app.getId(),
                app.getTenantId(),
                app.getName(),
                JsonMaps.stringVal(config, "clientId", app.getSlug()),
                JsonMaps.stringVal(config, "type", "web"),
                app.getStatus().toLowerCase(Locale.ROOT),
                JsonMaps.stringList(config, "grantTypes"),
                JsonMaps.stringList(config, "scopes"),
                JsonMaps.stringList(config, "redirectUris"),
                app.getCreatedAt());
    }

    private static Map<String, Object> buildConfig(
            String type, String clientId, String slug, List<String> grantTypes, List<String> scopes, List<String> redirectUris) {
        Map<String, Object> config = new HashMap<>();
        config.put("type", type != null && !type.isBlank() ? type : "web");
        config.put("clientId", clientId != null && !clientId.isBlank() ? clientId.trim() : slug);
        config.put("grantTypes", grantTypes != null ? grantTypes : List.of("authorization_code", "refresh_token"));
        config.put("scopes", scopes != null ? scopes : List.of("openid", "profile"));
        config.put("redirectUris", redirectUris != null ? redirectUris : List.of());
        return config;
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
}
