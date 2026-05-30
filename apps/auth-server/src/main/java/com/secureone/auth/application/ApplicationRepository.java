package com.secureone.auth.application;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationRepository extends JpaRepository<Application, UUID> {
    long countByTenantId(UUID tenantId);

    List<Application> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);
}
