package com.secureone.auth.rbac;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PermissionRepository extends JpaRepository<Permission, UUID> {
    List<Permission> findByApplicationIdOrderByKeyAsc(UUID applicationId);

    boolean existsByApplicationIdAndKey(UUID applicationId, String key);
}
