package com.secureone.auth.admin.settings;

import com.secureone.auth.notify.EmailNotificationService;
import com.secureone.auth.platform.AuthSettingsService;
import com.secureone.auth.platform.PlatformSettingsService;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/v1/settings")
public class SettingsAdminController {

    private final EmailNotificationService emailService;
    private final PlatformSettingsService platformSettings;
    private final AuthSettingsService authSettings;

    public SettingsAdminController(
            EmailNotificationService emailService,
            PlatformSettingsService platformSettings,
            AuthSettingsService authSettings) {
        this.emailService = emailService;
        this.platformSettings = platformSettings;
        this.authSettings = authSettings;
    }

    @GetMapping("/notifications")
    public Map<String, Object> getNotifications() {
        Map<String, Object> body = new HashMap<>(emailService.getNotificationSettings());
        body.put("smtpConfigured", emailService.isMailConfigured());
        return body;
    }

    @PutMapping("/notifications")
    public Map<String, Object> updateNotifications(@RequestBody Map<String, Object> body) {
        Map<String, Object> saved = emailService.saveNotificationSettings(body);
        saved.put("smtpConfigured", emailService.isMailConfigured());
        return saved;
    }

    @GetMapping("/email")
    public Map<String, Object> getEmail() {
        Map<String, Object> body = new HashMap<>(emailService.getEmailSettings());
        body.put("smtpConfigured", emailService.isMailConfigured());
        return body;
    }

    @PutMapping("/email")
    public Map<String, Object> updateEmail(@RequestBody Map<String, Object> body) {
        Map<String, Object> saved = emailService.saveEmailSettings(body);
        saved.put("smtpConfigured", emailService.isMailConfigured());
        return saved;
    }

    public record TestEmailRequest(@NotBlank @Email String to) {}

    @PostMapping("/email/test")
    public Map<String, String> sendTestEmail(@RequestBody TestEmailRequest request) {
        emailService.sendTestEmail(request.to());
        return Map.of("status", "sent", "to", request.to());
    }

    /** Admin UI theme / appearance (stored in platform_setting.appearance). */
    @GetMapping("/appearance")
    public Map<String, Object> getAppearance() {
        return new HashMap<>(platformSettings.get("appearance"));
    }

    @PutMapping("/appearance")
    public Map<String, Object> updateAppearance(@RequestBody Map<String, Object> body) {
        return platformSettings.saveMap("appearance", body);
    }

    @GetMapping("/auth-methods")
    public List<Map<String, Object>> getAuthMethods() {
        return authSettings.getAuthMethods();
    }

    @PutMapping("/auth-methods")
    public List<Map<String, Object>> updateAuthMethods(@RequestBody List<Map<String, Object>> body) {
        return authSettings.saveAuthMethods(body);
    }

    @GetMapping("/password-policy")
    public Map<String, Object> getPasswordPolicy() {
        return authSettings.getPasswordPolicy();
    }

    @PutMapping("/password-policy")
    public Map<String, Object> updatePasswordPolicy(@RequestBody Map<String, Object> body) {
        return authSettings.savePasswordPolicy(body);
    }

    @GetMapping("/feature-flags")
    public List<Map<String, Object>> getFeatureFlags() {
        return authSettings.getFeatureFlags();
    }

    @PutMapping("/feature-flags")
    public List<Map<String, Object>> updateFeatureFlags(@RequestBody List<Map<String, Object>> body) {
        return authSettings.saveFeatureFlags(body);
    }
}
