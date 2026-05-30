package com.secureone.auth.admin;

import com.secureone.auth.admin.AdminAccessService.ApplicationSummary;
import com.secureone.auth.application.ApplicationRepository;
import com.secureone.auth.tenant.Tenant;
import com.secureone.auth.tenant.TenantRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/v1/context")
public class AdminContextController {

    private final AdminAccessService access;
    private final ApplicationRepository applications;
    private final TenantRepository tenants;

    public AdminContextController(
            AdminAccessService access, ApplicationRepository applications, TenantRepository tenants) {
        this.access = access;
        this.applications = applications;
        this.tenants = tenants;
    }

    public record ApplicationContextItem(
            UUID id,
            UUID tenantId,
            String tenantName,
            String tenantSlug,
            String name,
            String slug,
            String status) {}

    public record AdminContextResponse(
            boolean platformSuperAdmin,
            String principal,
            String actAsEmail,
            List<ApplicationContextItem> applications) {}

    @GetMapping
    public AdminContextResponse context(
            Authentication authentication,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail) {
        boolean superAdmin = access.isPlatformSuperAdmin(authentication);
        List<ApplicationSummary> apps = access.accessibleApplications(authentication, actAsEmail);
        List<ApplicationContextItem> items = new ArrayList<>();
        for (ApplicationSummary app : apps) {
            Tenant tenant = tenants.findById(app.tenantId()).orElse(null);
            items.add(new ApplicationContextItem(
                    app.id(),
                    app.tenantId(),
                    tenant != null ? tenant.getName() : app.tenantId().toString(),
                    tenant != null ? tenant.getSlug() : "",
                    app.name(),
                    app.slug(),
                    app.status()));
        }
        return new AdminContextResponse(
                superAdmin,
                authentication != null ? authentication.getName() : "",
                actAsEmail,
                items);
    }

    @GetMapping("/tenants")
    public List<Map<String, Object>> tenantsForApplication(
            Authentication authentication,
            @org.springframework.web.bind.annotation.RequestParam UUID applicationId,
            @RequestHeader(value = "X-Act-As-Email", required = false) String actAsEmail) {
        access.requireApplicationAccess(authentication, actAsEmail, applicationId);
        var app = applications
                .findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
        return tenants.findById(app.getTenantId()).stream()
                .map(t -> Map.<String, Object>of(
                        "id", t.getId(),
                        "slug", t.getSlug(),
                        "name", t.getName(),
                        "status", t.getStatus()))
                .toList();
    }
}
