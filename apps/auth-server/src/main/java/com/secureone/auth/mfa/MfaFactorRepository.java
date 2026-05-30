package com.secureone.auth.mfa;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MfaFactorRepository extends JpaRepository<MfaFactor, UUID> {
    List<MfaFactor> findByUserIdOrderByCreatedAtAsc(UUID userId);

    void deleteByUserId(UUID userId);
}
