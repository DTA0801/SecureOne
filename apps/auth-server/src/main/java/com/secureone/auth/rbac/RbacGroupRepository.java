package com.secureone.auth.rbac;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RbacGroupRepository extends JpaRepository<RbacGroup, UUID> {

    List<RbacGroup> findByApplicationIdOrderByNameAsc(UUID applicationId);

    Optional<RbacGroup> findByIdAndApplicationId(UUID id, UUID applicationId);

    boolean existsByApplicationIdAndName(UUID applicationId, String name);
}
