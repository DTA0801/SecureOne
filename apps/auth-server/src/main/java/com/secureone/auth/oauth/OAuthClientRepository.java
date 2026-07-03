package com.secureone.auth.oauth;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OAuthClientRepository extends JpaRepository<OAuthClient, UUID> {
    Optional<OAuthClient> findByClientId(String clientId);

    List<OAuthClient> findByApplicationIdOrderByCreatedAtDesc(UUID applicationId);

    long countByApplicationId(UUID applicationId);

    boolean existsByClientId(String clientId);
}
