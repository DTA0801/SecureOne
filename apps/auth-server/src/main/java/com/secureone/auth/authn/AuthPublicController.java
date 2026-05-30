package com.secureone.auth.authn;

import com.secureone.auth.platform.AuthSettingsService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthPublicController {

    private final AuthSettingsService authSettings;

    public AuthPublicController(AuthSettingsService authSettings) {
        this.authSettings = authSettings;
    }

    @GetMapping("/methods")
    public List<Map<String, Object>> methods() {
        return authSettings.getAuthMethods().stream()
                .map(m -> {
                    String id = String.valueOf(m.get("id"));
                    boolean enabled = Boolean.TRUE.equals(m.get("enabled"));
                    boolean implemented = !Boolean.FALSE.equals(m.get("implemented"));
                    return Map.<String, Object>of(
                            "id", id,
                            "name", m.get("name"),
                            "description", m.get("description"),
                            "category", m.get("category"),
                            "enabled", enabled,
                            "implemented", implemented,
                            "available", enabled && implemented);
                })
                .toList();
    }
}
