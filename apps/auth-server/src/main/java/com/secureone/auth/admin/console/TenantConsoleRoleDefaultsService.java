package com.secureone.auth.admin.console;

import com.secureone.auth.admin.ResourceNotFoundException;
import com.secureone.auth.tenant.TenantRepository;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class TenantConsoleRoleDefaultsService {

    private final TenantRepository tenants;
    private final TenantConsoleRoleDefaultsRepository defaults;

    public TenantConsoleRoleDefaultsService(TenantRepository tenants, TenantConsoleRoleDefaultsRepository defaults) {
        this.tenants = tenants;
        this.defaults = defaults;
    }

    @Transactional(readOnly = true)
    public List<String> resolveFeatureKeys(UUID tenantId, String roleKey) {
        requireTenant(tenantId);
        List<String> stored = defaults.findFeatureKeys(tenantId, roleKey);
        if (!stored.isEmpty()) {
            return stored;
        }
        AdminConsoleRoleType roleType = parseConsoleRoleType(roleKey);
        if (roleType != null) {
            return AdminConsoleCapabilityCatalog.baseFeatures(roleType).stream()
                    .map(ConsoleFeature::key)
                    .sorted()
                    .toList();
        }
        return List.of();
    }

    @Transactional(readOnly = true)
    public boolean hasCustomDefaults(UUID tenantId, String roleKey) {
        return defaults.hasDefaults(tenantId, roleKey);
    }

    public List<String> updateConsoleRoleFeatures(UUID tenantId, String roleKey, List<String> featureKeys) {
        requireTenant(tenantId);
        AdminConsoleRoleType roleType = parseConsoleRoleType(roleKey);
        if (roleType == null) {
            throw new IllegalArgumentException("Unknown console role: " + roleKey);
        }
        Set<String> normalized = new LinkedHashSet<>();
        for (String key : featureKeys != null ? featureKeys : List.<String>of()) {
            if (key == null || key.isBlank()) {
                continue;
            }
            ConsoleFeature feature = ConsoleFeature.fromKey(key)
                    .orElseThrow(() -> new IllegalArgumentException("Unknown console feature: " + key));
            normalized.add(feature.key());
        }
        defaults.replaceFeatures(tenantId, roleKey, new ArrayList<>(normalized));
        return resolveFeatureKeys(tenantId, roleKey);
    }

    private AdminConsoleRoleType parseConsoleRoleType(String roleKey) {
        if (roleKey == null || roleKey.isBlank()) {
            return null;
        }
        try {
            return AdminConsoleRoleType.valueOf(roleKey.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private void requireTenant(UUID tenantId) {
        if (!tenants.existsById(tenantId)) {
            throw new ResourceNotFoundException("Tenant not found: " + tenantId);
        }
    }
}
