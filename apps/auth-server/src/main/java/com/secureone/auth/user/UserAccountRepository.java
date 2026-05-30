package com.secureone.auth.user;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccount, UUID> {
    Optional<UserAccount> findByTenantIdAndEmail(UUID tenantId, String email);

    long countByTenantId(UUID tenantId);

    List<UserAccount> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);
}
