package com.secureone.auth.admin.console;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AdminConsoleAccessRepository extends JpaRepository<AdminConsoleAccess, UUID> {

    @Query(
            """
            SELECT a FROM AdminConsoleAccess a
            WHERE a.userId = :userId
              AND (a.expiresAt IS NULL OR a.expiresAt > CURRENT_TIMESTAMP)
            """)
    List<AdminConsoleAccess> findActiveByUserId(@Param("userId") UUID userId);

    @Query(
            """
            SELECT a FROM AdminConsoleAccess a
            WHERE a.tenantId = :tenantId
              AND (a.expiresAt IS NULL OR a.expiresAt > CURRENT_TIMESTAMP)
            ORDER BY a.grantedAt DESC
            """)
    List<AdminConsoleAccess> findActiveByTenantId(@Param("tenantId") UUID tenantId);

    @Query(
            """
            SELECT a FROM AdminConsoleAccess a
            WHERE a.userId = :userId
              AND a.tenantId = :tenantId
              AND a.roleType = com.secureone.auth.admin.console.AdminConsoleRoleType.TENANT_SUPER_ADMIN
              AND (a.expiresAt IS NULL OR a.expiresAt > CURRENT_TIMESTAMP)
            """)
    Optional<AdminConsoleAccess> findActiveTenantSuperAdmin(
            @Param("userId") UUID userId, @Param("tenantId") UUID tenantId);

    Optional<AdminConsoleAccess> findByUserIdAndTenantIdAndApplicationIdAndRoleType(
            UUID userId, UUID tenantId, UUID applicationId, AdminConsoleRoleType roleType);

    Optional<AdminConsoleAccess> findByUserIdAndTenantIdAndRoleTypeAndApplicationIdIsNull(
            UUID userId, UUID tenantId, AdminConsoleRoleType roleType);

    void deleteByUserIdAndTenantIdAndApplicationIdAndRoleType(
            UUID userId, UUID tenantId, UUID applicationId, AdminConsoleRoleType roleType);

    void deleteByUserIdAndTenantIdAndRoleTypeAndApplicationIdIsNull(
            UUID userId, UUID tenantId, AdminConsoleRoleType roleType);
}
