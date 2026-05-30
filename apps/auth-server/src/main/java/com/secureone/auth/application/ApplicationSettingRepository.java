package com.secureone.auth.application;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationSettingRepository
        extends JpaRepository<ApplicationSetting, ApplicationSetting.ApplicationSettingId> {

    Optional<ApplicationSetting> findByApplicationIdAndKey(UUID applicationId, String key);
}
