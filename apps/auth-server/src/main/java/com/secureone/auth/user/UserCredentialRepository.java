package com.secureone.auth.user;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserCredentialRepository extends JpaRepository<UserCredential, UUID> {

    Optional<UserCredential> findByUserIdAndCurrentTrue(UUID userId);

    List<UserCredential> findByUserId(UUID userId);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE UserCredential c SET c.current = false WHERE c.userId = :userId AND c.current = true")
    void clearCurrentForUser(@Param("userId") UUID userId);
}
