package com.secureone.auth.tenant.rbac;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantPermissionRepository extends JpaRepository<TenantPermission, UUID> {

    List<TenantPermission> findByTenantIdOrderByKeyAsc(UUID tenantId);

    Optional<TenantPermission> findByTenantIdAndKey(UUID tenantId, String key);

    boolean existsByTenantIdAndKey(UUID tenantId, String key);
}
