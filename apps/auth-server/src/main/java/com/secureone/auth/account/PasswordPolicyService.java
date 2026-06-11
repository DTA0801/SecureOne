package com.secureone.auth.account;

import com.secureone.auth.application.ApplicationEffectiveSettingsService;
import com.secureone.auth.platform.AuthSettingsService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class PasswordPolicyService {

    private final AuthSettingsService authSettings;
    private final ApplicationEffectiveSettingsService effectiveSettings;

    public PasswordPolicyService(
            AuthSettingsService authSettings, ApplicationEffectiveSettingsService effectiveSettings) {
        this.authSettings = authSettings;
        this.effectiveSettings = effectiveSettings;
    }

    public void validate(String password) {
        validate(password, null);
    }

    public void validate(String password, UUID applicationId) {
        PasswordPolicyRules.validate(password, resolvePolicy(applicationId));
    }

    public Map<String, Object> resolvePolicy(UUID applicationId) {
        return applicationId != null
                ? effectiveSettings.passwordPolicy(applicationId)
                : authSettings.getPasswordPolicy();
    }

    public Map<String, Object> publicPolicy(UUID applicationId) {
        return PasswordPolicyRules.publicPolicy(resolvePolicy(applicationId));
    }

    public List<Map<String, Object>> evaluate(String password, UUID applicationId) {
        return PasswordPolicyRules.evaluate(password, resolvePolicy(applicationId));
    }
}
