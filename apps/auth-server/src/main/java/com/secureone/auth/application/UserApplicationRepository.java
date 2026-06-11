package com.secureone.auth.application;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserApplicationRepository extends JpaRepository<UserApplication, UserApplication.UserApplicationId> {

    List<UserApplication> findByApplicationId(UUID applicationId);

    List<UserApplication> findByUserId(UUID userId);

    boolean existsByUserIdAndApplicationId(UUID userId, UUID applicationId);

    void deleteByUserIdAndApplicationId(UUID userId, UUID applicationId);

    void deleteByUserId(UUID userId);

    @Query("SELECT ua.userId FROM UserApplication ua WHERE ua.applicationId = :applicationId")
    List<UUID> findUserIdsByApplicationId(@Param("applicationId") UUID applicationId);
}
