package com.secureone.auth.audit;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditLogRepository extends JpaRepository<AuditLog, java.util.UUID> {

    @Query("SELECT a FROM AuditLog a ORDER BY a.createdAt DESC")
    List<AuditLog> findRecent();

    List<AuditLog> findByApplicationIdOrderByCreatedAtDesc(UUID applicationId);

    List<AuditLog> findByApplicationIdAndTenantIdOrderByCreatedAtDesc(UUID applicationId, UUID tenantId);

    @Query(
            """
            SELECT DISTINCT a.targetId FROM AuditLog a
            WHERE a.applicationId = :applicationId
              AND a.action = :action
              AND a.targetId IS NOT NULL
            """)
    List<UUID> findDistinctTargetIdsByApplicationIdAndAction(
            @Param("applicationId") UUID applicationId, @Param("action") String action);
}
