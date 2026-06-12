package com.secureone.auth.tenant.rbac;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantRoleRepository extends JpaRepository<TenantRole, UUID> {

    List<TenantRole> findByTenantIdOrderByNameAsc(UUID tenantId);

    List<TenantRole> findByTenantIdAndSystemRoleFalseOrderByNameAsc(UUID tenantId);

    Optional<TenantRole> findByTenantIdAndName(UUID tenantId, String name);

    boolean existsByTenantIdAndName(UUID tenantId, String name);
}
