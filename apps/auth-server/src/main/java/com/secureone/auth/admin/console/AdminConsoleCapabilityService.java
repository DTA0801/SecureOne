package com.secureone.auth.admin.console;

import com.secureone.auth.admin.ResourceNotFoundException;
import com.secureone.auth.application.Application;
import com.secureone.auth.application.ApplicationRepository;
import com.secureone.auth.tenant.TenantRepository;
import com.secureone.auth.user.UserAccount;
import com.secureone.auth.user.UserAccountRepository;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AdminConsoleCapabilityService {

    private final AdminConsoleAccessRepository consoleAccess;
    private final AdminConsoleFeatureOverrideRepository overrides;
    private final UserAccountRepository users;
    private final TenantRepository tenants;
    private final ApplicationRepository applications;

    public AdminConsoleCapabilityService(
            AdminConsoleAccessRepository consoleAccess,
            AdminConsoleFeatureOverrideRepository overrides,
            UserAccountRepository users,
            TenantRepository tenants,
            ApplicationRepository applications) {
        this.consoleAccess = consoleAccess;
        this.users = users;
        this.tenants = tenants;
        this.applications = applications;
        this.overrides = overrides;
    }

    public record FeatureOverride(String featureKey, String effect) {}

    public record UserConsoleCapabilities(
            UUID userId,
            UUID tenantId,
            List<String> effectiveFeatures,
            List<String> roleDefaults,
            List<FeatureOverride> overrides) {}

    public boolean hasConsoleAccess(UUID userId) {
        return !consoleAccess.findActiveByUserId(userId).isEmpty();
    }

    public List<String> effectiveFeatureKeys(UUID userId, UUID tenantId, UUID applicationId) {
        return effectiveFeatures(userId, tenantId, applicationId).stream()
                .map(ConsoleFeature::key)
                .sorted()
                .toList();
    }

    public Set<ConsoleFeature> effectiveFeatures(UUID userId, UUID tenantId, UUID applicationId) {
        if (!hasConsoleAccess(userId)) {
            return Set.of();
        }
        Set<ConsoleFeature> base = baseFeaturesFromRoles(userId, tenantId, applicationId);
        Set<ConsoleFeature> effective = EnumSet.copyOf(base);
        for (AdminConsoleFeatureOverride row : overrides.findByUserIdAndTenantId(userId, tenantId)) {
            ConsoleFeature feature = ConsoleFeature.fromKey(row.getFeatureKey()).orElse(null);
            if (feature == null) {
                continue;
            }
            if ("GRANT".equalsIgnoreCase(row.getEffect())) {
                effective.add(feature);
            } else if ("DENY".equalsIgnoreCase(row.getEffect())) {
                effective.remove(feature);
            }
        }
        return effective;
    }

    public boolean canAccessFeature(UUID userId, UUID tenantId, UUID applicationId, String featureKey) {
        ConsoleFeature feature = ConsoleFeature.fromKey(featureKey).orElse(null);
        if (feature == null) {
            return false;
        }
        return effectiveFeatures(userId, tenantId, applicationId).contains(feature);
    }

    public UserConsoleCapabilities describeForUser(UUID tenantId, UUID userId) {
        tenants.findById(tenantId).orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));
        users.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        List<AdminConsoleFeatureOverride> rows = overrides.findByUserIdAndTenantId(userId, tenantId);
        Set<ConsoleFeature> roleDefaults = baseFeaturesFromAllRoles(userId, tenantId);
        UUID firstAppId = applications.findByTenantIdOrderByCreatedAtDesc(tenantId).stream()
                .map(Application::getId)
                .findFirst()
                .orElse(null);
        Set<ConsoleFeature> effective =
                firstAppId != null ? effectiveFeatures(userId, tenantId, firstAppId) : Set.copyOf(roleDefaults);
        List<FeatureOverride> overrideItems = rows.stream()
                .sorted(Comparator.comparing(AdminConsoleFeatureOverride::getFeatureKey))
                .map(row -> new FeatureOverride(row.getFeatureKey(), row.getEffect()))
                .toList();
        return new UserConsoleCapabilities(
                userId,
                tenantId,
                effective.stream().map(ConsoleFeature::key).sorted().toList(),
                roleDefaults.stream().map(ConsoleFeature::key).sorted().toList(),
                overrideItems);
    }

    @Transactional
    public UserConsoleCapabilities replaceOverrides(UUID tenantId, UUID userId, List<FeatureOverride> items) {
        tenants.findById(tenantId).orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));
        UserAccount user = users.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!user.getTenantId().equals(tenantId)) {
            throw new IllegalArgumentException("User must belong to this tenant");
        }
        if (!hasConsoleAccess(userId)) {
            throw new IllegalArgumentException("User does not have admin console access");
        }
        overrides.deleteByUserIdAndTenantId(userId, tenantId);
        if (items != null) {
            for (FeatureOverride item : items) {
                if (item == null || item.featureKey() == null || item.featureKey().isBlank()) {
                    continue;
                }
                ConsoleFeature.fromKey(item.featureKey())
                        .orElseThrow(() -> new IllegalArgumentException("Unknown feature: " + item.featureKey()));
                String effect = item.effect() != null ? item.effect().trim().toUpperCase() : "";
                if (!"GRANT".equals(effect) && !"DENY".equals(effect)) {
                    throw new IllegalArgumentException("effect must be GRANT or DENY");
                }
                AdminConsoleFeatureOverride row = new AdminConsoleFeatureOverride();
                row.setUserId(userId);
                row.setTenantId(tenantId);
                row.setFeatureKey(item.featureKey().trim().toLowerCase());
                row.setEffect(effect);
                overrides.save(row);
            }
        }
        return describeForUser(tenantId, userId);
    }

    public List<String> allFeatureKeys() {
        return java.util.Arrays.stream(ConsoleFeature.values())
                .map(ConsoleFeature::key)
                .sorted()
                .toList();
    }

    public List<String> defaultFeaturesForRole(AdminConsoleRoleType roleType) {
        return AdminConsoleCapabilityCatalog.baseFeatures(roleType).stream()
                .map(ConsoleFeature::key)
                .sorted()
                .toList();
    }

    private Set<ConsoleFeature> baseFeaturesFromAllRoles(UUID userId, UUID tenantId) {
        Set<ConsoleFeature> features = EnumSet.noneOf(ConsoleFeature.class);
        for (AdminConsoleAccess row : consoleAccess.findActiveByTenantId(tenantId)) {
            if (!row.getUserId().equals(userId)) {
                continue;
            }
            features.addAll(AdminConsoleCapabilityCatalog.baseFeatures(row.getRoleType()));
        }
        return features;
    }

    private Set<ConsoleFeature> baseFeaturesFromRoles(UUID userId, UUID tenantId, UUID applicationId) {
        Set<ConsoleFeature> features = EnumSet.noneOf(ConsoleFeature.class);
        for (AdminConsoleAccess row : consoleAccess.findActiveByUserId(userId)) {
            if (!row.getTenantId().equals(tenantId)) {
                continue;
            }
            if (row.getRoleType() == AdminConsoleRoleType.TENANT_SUPER_ADMIN) {
                return EnumSet.allOf(ConsoleFeature.class);
            }
            if (row.getRoleType() == AdminConsoleRoleType.TENANT_ADMIN
                    || row.getRoleType() == AdminConsoleRoleType.APPLICATION_ADMIN) {
                if (row.getApplicationId() != null && row.getApplicationId().equals(applicationId)) {
                    features.addAll(AdminConsoleCapabilityCatalog.baseFeatures(row.getRoleType()));
                }
            }
        }
        return features;
    }
}
