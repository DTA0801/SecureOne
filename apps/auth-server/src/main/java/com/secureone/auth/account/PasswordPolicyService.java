package com.secureone.auth.account;

import com.secureone.auth.platform.AuthSettingsService;
import java.util.Map;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

@Service
public class PasswordPolicyService {

    private final AuthSettingsService authSettings;

    public PasswordPolicyService(AuthSettingsService authSettings) {
        this.authSettings = authSettings;
    }

    public void validate(String password) {
        Map<String, Object> policy = authSettings.getPasswordPolicy();
        int minLength = number(policy, "minLength", 8);
        if (password == null || password.length() < minLength) {
            throw new IllegalArgumentException("Password must be at least " + minLength + " characters.");
        }
        if (bool(policy, "requireUppercase") && !Pattern.compile("[A-Z]").matcher(password).find()) {
            throw new IllegalArgumentException("Password must include an uppercase letter.");
        }
        if (bool(policy, "requireNumber") && !Pattern.compile("[0-9]").matcher(password).find()) {
            throw new IllegalArgumentException("Password must include a number.");
        }
        if (bool(policy, "requireSymbol")
                && !Pattern.compile("[^a-zA-Z0-9]").matcher(password).find()) {
            throw new IllegalArgumentException("Password must include a symbol.");
        }
    }

    private static int number(Map<String, Object> map, String key, int fallback) {
        Object v = map.get(key);
        if (v instanceof Number n) {
            return n.intValue();
        }
        return fallback;
    }

    private static boolean bool(Map<String, Object> map, String key) {
        Object v = map.get(key);
        return Boolean.TRUE.equals(v);
    }
}
