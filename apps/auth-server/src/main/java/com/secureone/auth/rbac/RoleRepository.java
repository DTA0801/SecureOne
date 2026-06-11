package com.secureone.auth.rbac;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, UUID> {
    List<Role> findByTenantIdOrderByNameAsc(UUID tenantId);

    List<Role> findByApplicationIdOrderByNameAsc(UUID applicationId);

    List<Role> findByNameContainingIgnoreCase(String namePart);

    boolean existsByApplicationIdAndName(UUID applicationId, String name);

    Optional<Role> findFirstByApplicationIdAndDefaultRoleTrue(UUID applicationId);

    Optional<Role> findByApplicationIdAndName(UUID applicationId, String name);
}
