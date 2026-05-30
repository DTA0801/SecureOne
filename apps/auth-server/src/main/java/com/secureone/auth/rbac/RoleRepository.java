package com.secureone.auth.rbac;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, UUID> {
    List<Role> findByTenantIdOrderByNameAsc(UUID tenantId);

    List<Role> findByNameContainingIgnoreCase(String namePart);
}
