package com.secureone.auth.admin.console;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminConsoleFeatureOverrideRepository
        extends JpaRepository<AdminConsoleFeatureOverride, UUID> {

    List<AdminConsoleFeatureOverride> findByUserIdAndTenantId(UUID userId, UUID tenantId);

    void deleteByUserIdAndTenantId(UUID userId, UUID tenantId);
}
