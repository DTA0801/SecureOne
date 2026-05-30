package com.secureone.auth.rbac;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {
    long countByRoleId(UUID roleId);

    List<UserRole> findByUserId(UUID userId);

    void deleteByUserId(UUID userId);

    @Query("SELECT DISTINCT ur.userId FROM UserRole ur WHERE ur.userId IS NOT NULL AND ur.roleId IN :roleIds")
    List<UUID> findDistinctUserIdsByRoleIdIn(@Param("roleIds") Collection<UUID> roleIds);
}
