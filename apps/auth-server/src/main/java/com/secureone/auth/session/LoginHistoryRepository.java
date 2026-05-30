package com.secureone.auth.session;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface LoginHistoryRepository extends JpaRepository<LoginHistory, UUID> {

    @Query("SELECT l FROM LoginHistory l ORDER BY l.createdAt DESC")
    List<LoginHistory> findRecent();

    List<LoginHistory> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
