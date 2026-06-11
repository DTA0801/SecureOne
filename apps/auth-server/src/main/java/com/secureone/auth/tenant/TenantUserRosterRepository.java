package com.secureone.auth.tenant;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantUserRosterRepository extends JpaRepository<TenantUserRoster, TenantUserRoster.TenantUserRosterId> {
    List<TenantUserRoster> findByTenantIdOrderByAddedAtDesc(UUID tenantId);

    List<TenantUserRoster> findByUserId(UUID userId);

    Optional<TenantUserRoster> findByTenantIdAndUserId(UUID tenantId, UUID userId);

    boolean existsByTenantIdAndUserId(UUID tenantId, UUID userId);

    long countByTenantId(UUID tenantId);

    void deleteByTenantIdAndUserId(UUID tenantId, UUID userId);
}
