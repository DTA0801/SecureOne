package com.secureone.auth.catalog;

import com.secureone.auth.application.Application;
import com.secureone.auth.application.ApplicationRepository;
import com.secureone.auth.rbac.RbacBootstrapService;
import com.secureone.auth.tenant.Tenant;
import com.secureone.auth.tenant.TenantRepository;
import com.secureone.auth.tenant.rbac.TenantRbacBootstrapService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Re-seeds catalog rows (permissions, roles, platform settings) after manual table truncation. */
@Component
public class CatalogRepairBootstrap {

    private static final Logger log = LoggerFactory.getLogger(CatalogRepairBootstrap.class);

    private final TenantRepository tenants;
    private final ApplicationRepository applications;
    private final TenantRbacBootstrapService tenantRbac;
    private final RbacBootstrapService applicationRbac;

    public CatalogRepairBootstrap(
            TenantRepository tenants,
            ApplicationRepository applications,
            TenantRbacBootstrapService tenantRbac,
            RbacBootstrapService applicationRbac) {
        this.tenants = tenants;
        this.applications = applications;
        this.tenantRbac = tenantRbac;
        this.applicationRbac = applicationRbac;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void repairCatalogs() {
        int tenantCount = 0;
        int appCount = 0;
        for (Tenant tenant : tenants.findAll()) {
            tenantRbac.seedForTenant(tenant.getId());
            tenantCount++;
        }
        for (Application app : applications.findAll()) {
            applicationRbac.seedDefaultRoles(app.getTenantId(), app.getId());
            appCount++;
        }
        if (tenantCount > 0 || appCount > 0) {
            log.info("Catalog repair checked {} tenant(s) and {} application(s)", tenantCount, appCount);
        }
    }
}
