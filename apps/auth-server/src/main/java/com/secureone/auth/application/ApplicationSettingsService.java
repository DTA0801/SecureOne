package com.secureone.auth.application;

import com.secureone.auth.admin.ResourceNotFoundException;
import com.secureone.auth.notify.EmailNotificationService;
import com.secureone.auth.platform.AuthSettingsService;
import com.secureone.auth.platform.FeatureFlagMerge;
import com.secureone.auth.platform.PlatformSettingsService;
import com.secureone.auth.platform.SettingsExposureService;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Resolves settings for an application: app override, else platform default. */
@Service
@Transactional
public class ApplicationSettingsService {

    private final ApplicationRepository applications;
    private final ApplicationSettingRepository appSettings;
    private final PlatformSettingsService platformSettings;
    private final AuthSettingsService authSettings;
    private final EmailNotificationService emailService;
    private final SettingsExposureService exposure;

    public ApplicationSettingsService(
            ApplicationRepository applications,
            ApplicationSettingRepository appSettings,
            PlatformSettingsService platformSettings,
            AuthSettingsService authSettings,
            EmailNotificationService emailService,
            SettingsExposureService exposure) {
        this.applications = applications;
        this.appSettings = appSettings;
        this.platformSettings = platformSettings;
        this.authSettings = authSettings;
        this.emailService = emailService;
        this.exposure = exposure;
    }

    public void requireApplication(UUID applicationId) {
        if (!applications.existsById(applicationId)) {
            throw new ResourceNotFoundException("Application not found: " + applicationId);
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Boolean> getExposureForApplication(UUID applicationId) {
        requireApplication(applicationId);
        return exposure.getExposure();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getWorkspace(UUID applicationId) {
        requireApplication(applicationId);
        Map<String, Object> workspace = new LinkedHashMap<>();
        workspace.put("exposure", exposure.getExposure());
        Map<String, Boolean> exposed = exposure.getExposure();
        if (Boolean.TRUE.equals(exposed.get("notifications"))) {
            workspace.put("notifications", getNotifications(applicationId));
        }
        if (Boolean.TRUE.equals(exposed.get("email"))) {
            workspace.put("email", getEmail(applicationId));
        }
        if (Boolean.TRUE.equals(exposed.get("auth-methods"))) {
            workspace.put("authMethods", getAuthMethods(applicationId));
        }
        if (Boolean.TRUE.equals(exposed.get("password-policy"))) {
            workspace.put("passwordPolicy", getPasswordPolicy(applicationId));
        }
        if (Boolean.TRUE.equals(exposed.get("feature-flags"))) {
            workspace.put("featureFlags", getFeatureFlags(applicationId));
        }
        if (Boolean.TRUE.equals(exposed.get("appearance"))) {
            workspace.put("appearance", getAppearance(applicationId));
        }
        if (Boolean.TRUE.equals(exposed.get("user-directory"))) {
            workspace.put("userDirectory", getUserDirectory(applicationId));
        }
        if (Boolean.TRUE.equals(exposed.get("public-manifest"))) {
            workspace.put("publicManifest", getPublicManifestConfigSummary(applicationId));
        }
        if (Boolean.TRUE.equals(exposed.get("token-policy"))) {
            workspace.put("tokenPolicy", getTokenPolicy(applicationId));
        }
        return workspace;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getTokenPolicy(UUID applicationId) {
        requireExposed("token-policy");
        requireApplication(applicationId);
        Map<String, Object> merged =
                TokenPolicyDefaults.merge(platformTokenPolicy(), getAppMap(applicationId, "token_policy").orElse(Map.of()));
        merged.put("tabEnabled", TokenPolicyDefaults.tabEnabled(merged));
        merged.put("scope", "application");
        merged.put("inheritsPlatformDefaults", !hasOverride(applicationId, "token_policy"));
        return merged;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getTokenTabState(UUID applicationId) {
        requireExposed("token-policy");
        requireApplication(applicationId);
        Map<String, Object> appRow = getAppMap(applicationId, "token_policy").orElse(Map.of());
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("platformExposed", true);
        out.put("tabEnabled", TokenPolicyDefaults.tabEnabled(appRow));
        return out;
    }

    public Map<String, Object> saveTokenTabEnabled(UUID applicationId, boolean enabled) {
        requireExposed("token-policy");
        requireApplication(applicationId);
        Map<String, Object> next = new HashMap<>(resolveTokenPolicy(applicationId));
        next.put("tabEnabled", enabled);
        saveAppMap(applicationId, "token_policy", TokenPolicyDefaults.sanitizeForSave(next));
        if (enabled) {
            syncTokenPolicyToApplicationConfig(applicationId);
        } else {
            applications.findById(applicationId).ifPresent(app -> {
                Map<String, Object> config = new HashMap<>(app.getConfig() != null ? app.getConfig() : Map.of());
                config.remove("tokenPolicy");
                app.setConfig(config);
            });
        }
        return getTokenTabState(applicationId);
    }

    public Map<String, Object> saveTokenPolicy(UUID applicationId, Map<String, Object> body) {
        requireExposed("token-policy");
        requireApplication(applicationId);
        if (!TokenPolicyDefaults.tabEnabled(body)) {
            throw new IllegalArgumentException(
                    "Enable the OAuth tokens tab for this application before saving token policy.");
        }
        Map<String, Object> sanitized = TokenPolicyDefaults.sanitizeForSave(body);
        sanitized.put("tabEnabled", true);
        saveAppMap(applicationId, "token_policy", sanitized);
        syncTokenPolicyToApplicationConfig(applicationId);
        return getTokenPolicy(applicationId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> resolveTokenPolicy(UUID applicationId) {
        requireApplication(applicationId);
        return TokenPolicyDefaults.merge(
                platformTokenPolicy(), getAppMap(applicationId, "token_policy").orElse(Map.of()));
    }

    private Map<String, Object> platformTokenPolicy() {
        Map<String, Object> platform = platformSettings.get("token_policy");
        if (platform == null || platform.isEmpty()) {
            return TokenPolicyDefaults.platformDefaults();
        }
        return platform;
    }

    private void syncTokenPolicyToApplicationConfig(UUID applicationId) {
        applications.findById(applicationId).ifPresent(app -> {
            Map<String, Object> config = new HashMap<>(app.getConfig() != null ? app.getConfig() : Map.of());
            Map<String, Object> policy = resolveTokenPolicy(applicationId);
            policy.remove("scope");
            policy.remove("inheritsPlatformDefaults");
            policy.remove("tabEnabled");
            if (TokenPolicyDefaults.tabEnabled(resolveTokenPolicy(applicationId))) {
                config.put("tokenPolicy", policy);
            } else {
                config.remove("tokenPolicy");
            }
            app.setConfig(config);
        });
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPublicManifestConfigSummary(UUID applicationId) {
        requireExposed("public-manifest");
        requireApplication(applicationId);
        Map<String, Object> platform = platformSettings.get("public_manifest_defaults");
        if (platform == null || platform.isEmpty()) {
            platform = PublicManifestDefaults.platformDefaults();
        }
        Map<String, Object> merged =
                PublicManifestDefaults.merge(platform, getAppMap(applicationId, "public_manifest").orElse(Map.of()));
        merged.put("scope", "application");
        merged.put("inheritsPlatformDefaults", !hasOverride(applicationId, "public_manifest"));
        merged.put("publicEndpoint", "/api/v1/applications/" + applicationId);
        return merged;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getUserDirectory(UUID applicationId) {
        requireExposed("user-directory");
        requireApplication(applicationId);
        Map<String, Object> platform = platformSettings.get("user_directory");
        if (platform == null || platform.isEmpty()) {
            platform = UserDirectoryDefaults.platformDefaults();
        }
        Map<String, Object> merged = UserDirectoryDefaults.merge(platform, getAppMap(applicationId, "user_directory").orElse(Map.of()));
        merged.put("scope", "application");
        merged.put("inheritsPlatformDefaults", !hasOverride(applicationId, "user_directory"));
        return merged;
    }

    public Map<String, Object> saveUserDirectory(UUID applicationId, Map<String, Object> body) {
        requireExposed("user-directory");
        requireApplication(applicationId);
        saveAppMap(applicationId, "user_directory", body);
        return getUserDirectory(applicationId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getNotifications(UUID applicationId) {
        requireExposed("notifications");
        requireApplication(applicationId);
        Map<String, Object> merged = new HashMap<>(platformSettings.get("notifications"));
        getAppMap(applicationId, "notifications").ifPresent(merged::putAll);
        merged.put("scope", "application");
        merged.put("inheritsPlatformDefaults", !hasOverride(applicationId, "notifications"));
        merged.put("smtpConfigured", emailService.isMailConfigured());
        return merged;
    }

    public Map<String, Object> saveNotifications(UUID applicationId, Map<String, Object> body) {
        requireExposed("notifications");
        requireApplication(applicationId);
        saveAppMap(applicationId, "notifications", body);
        return getNotifications(applicationId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getEmail(UUID applicationId) {
        requireExposed("email");
        requireApplication(applicationId);
        Map<String, Object> merged = new HashMap<>(platformSettings.get("email"));
        getAppMap(applicationId, "email").ifPresent(merged::putAll);
        merged.put("scope", "application");
        merged.put("inheritsPlatformDefaults", !hasOverride(applicationId, "email"));
        merged.put("smtpConfigured", emailService.isMailConfigured());
        return merged;
    }

    public Map<String, Object> saveEmail(UUID applicationId, Map<String, Object> body) {
        requireExposed("email");
        requireApplication(applicationId);
        saveAppMap(applicationId, "email", body);
        return getEmail(applicationId);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAuthMethods(UUID applicationId) {
        requireExposed("auth-methods");
        requireApplication(applicationId);
        List<Map<String, Object>> merged = mergeList(authSettings.getAuthMethods(), getAppRaw(applicationId, "auth_methods"));
        merged.forEach(m -> m.put("inheritsPlatformDefaults", !hasOverride(applicationId, "auth_methods")));
        return merged;
    }

    public List<Map<String, Object>> saveAuthMethods(UUID applicationId, List<Map<String, Object>> body) {
        requireExposed("auth-methods");
        requireApplication(applicationId);
        saveAppRaw(applicationId, "auth_methods", stripMeta(new ArrayList<>(body)));
        return getAuthMethods(applicationId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMfaTabState(UUID applicationId) {
        requireExposed("auth-methods");
        requireApplication(applicationId);
        Map<String, Object> appRow = getAppMap(applicationId, AuthMfaTabDefaults.SETTING_KEY).orElse(Map.of());
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("platformExposed", true);
        out.put("tabEnabled", AuthMfaTabDefaults.tabEnabled(appRow));
        return out;
    }

    public Map<String, Object> saveMfaTabEnabled(UUID applicationId, boolean enabled) {
        requireExposed("auth-methods");
        requireApplication(applicationId);
        Map<String, Object> next = new HashMap<>(AuthMfaTabDefaults.platformDefaults());
        next.putAll(getAppMap(applicationId, AuthMfaTabDefaults.SETTING_KEY).orElse(Map.of()));
        next.put("tabEnabled", enabled);
        saveAppMap(applicationId, AuthMfaTabDefaults.SETTING_KEY, next);
        return getMfaTabState(applicationId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPasswordPolicy(UUID applicationId) {
        requireExposed("password-policy");
        requireApplication(applicationId);
        Map<String, Object> merged = new HashMap<>(authSettings.getPasswordPolicy());
        getAppMap(applicationId, "password_policy").ifPresent(merged::putAll);
        merged.put("scope", "application");
        merged.put("inheritsPlatformDefaults", !hasOverride(applicationId, "password_policy"));
        return merged;
    }

    public Map<String, Object> savePasswordPolicy(UUID applicationId, Map<String, Object> body) {
        requireExposed("password-policy");
        requireApplication(applicationId);
        saveAppMap(applicationId, "password_policy", PasswordPolicySanitizer.sanitize(body));
        return getPasswordPolicy(applicationId);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getFeatureFlags(UUID applicationId) {
        requireExposed("feature-flags");
        requireApplication(applicationId);
        return FeatureFlagMerge.merge(
                authSettings.getFeatureFlags(), getAppRaw(applicationId, "feature_flags"));
    }

    public List<Map<String, Object>> saveFeatureFlags(UUID applicationId, List<Map<String, Object>> body) {
        requireExposed("feature-flags");
        requireApplication(applicationId);
        saveAppRaw(applicationId, "feature_flags", FeatureFlagSanitizer.sanitize(stripMeta(new ArrayList<>(body))));
        return getFeatureFlags(applicationId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAppearance(UUID applicationId) {
        requireExposed("appearance");
        requireApplication(applicationId);
        Map<String, Object> merged =
                ClientAppearanceDefaults.merge(
                        ClientAppearanceDefaults.platformDefaults(),
                        getAppMap(applicationId, "appearance").orElse(Map.of()));
        merged.put("scope", "application");
        merged.put("inheritsPlatformDefaults", !hasOverride(applicationId, "appearance"));
        return merged;
    }

    public Map<String, Object> saveAppearance(UUID applicationId, Map<String, Object> body) {
        requireExposed("appearance");
        requireApplication(applicationId);
        saveAppMap(applicationId, "appearance", ClientAppearanceDefaults.stripMeta(body));
        return getAppearance(applicationId);
    }

    @Transactional(readOnly = true)
    public Map<String, String> getPolicySources(UUID applicationId) {
        requireApplication(applicationId);
        Map<String, String> sources = new LinkedHashMap<>();
        Map<String, String> sections = new LinkedHashMap<>();
        sections.put("notifications", "notifications");
        sections.put("email", "email");
        sections.put("auth-methods", "auth_methods");
        sections.put("password-policy", "password_policy");
        sections.put("feature-flags", "feature_flags");
        sections.put("appearance", "appearance");
        sections.put("user-directory", "user_directory");
        sections.put("public-manifest", "public_manifest");
        sections.put("token-policy", "token_policy");
        for (var entry : sections.entrySet()) {
            if (exposure.isExposed(entry.getKey())) {
                sources.put(entry.getKey(), policySource(applicationId, entry.getValue()));
            }
        }
        return sources;
    }

    public String getPolicySource(UUID applicationId, String exposureKey) {
        requireApplication(applicationId);
        String settingKey = SettingsSectionKeys.settingKeyForExposure(exposureKey);
        if (settingKey == null) {
            throw new IllegalArgumentException("Unknown settings section: " + exposureKey);
        }
        requireExposed(exposureKey);
        return policySource(applicationId, settingKey);
    }

    public String setPolicySource(UUID applicationId, String exposureKey, String source) {
        requireApplication(applicationId);
        String settingKey = SettingsSectionKeys.settingKeyForExposure(exposureKey);
        if (settingKey == null) {
            throw new IllegalArgumentException("Unknown settings section: " + exposureKey);
        }
        requireExposed(exposureKey);
        if ("platform".equalsIgnoreCase(source)) {
            clearOverride(applicationId, settingKey);
            return "platform";
        }
        if ("application".equalsIgnoreCase(source)) {
            snapshotEffectiveAsOverride(applicationId, settingKey);
            return "application";
        }
        throw new IllegalArgumentException("source must be 'platform' or 'application'");
    }

    public void clearOverride(UUID applicationId, String key) {
        requireApplication(applicationId);
        String exposureKey = SettingsSectionKeys.exposureForSettingKey(key);
        if (exposureKey != null) {
            requireExposed(exposureKey);
        }
        appSettings
                .findByApplicationIdAndKey(applicationId, key)
                .ifPresent(row -> {
                    appSettings.delete(row);
                    if ("token_policy".equals(key)) {
                        syncTokenPolicyToApplicationConfig(applicationId);
                    }
                });
    }

    private String policySource(UUID applicationId, String settingKey) {
        return hasOverride(applicationId, settingKey) ? "application" : "platform";
    }

    private void snapshotEffectiveAsOverride(UUID applicationId, String settingKey) {
        if (hasOverride(applicationId, settingKey)) {
            return;
        }
        switch (settingKey) {
            case "notifications" -> saveAppMap(applicationId, settingKey, new HashMap<>(platformSettings.get("notifications")));
            case "email" -> saveAppMap(applicationId, settingKey, new HashMap<>(platformSettings.get("email")));
            case "auth_methods" -> saveAppRaw(
                    applicationId, settingKey, stripMeta(copyList(authSettings.getAuthMethods())));
            case "password_policy" -> saveAppMap(applicationId, settingKey, new HashMap<>(authSettings.getPasswordPolicy()));
            case "feature_flags" -> saveAppRaw(
                    applicationId, settingKey, stripMeta(copyList(authSettings.getFeatureFlags())));
            case "appearance" -> saveAppMap(applicationId, settingKey, new HashMap<>(platformSettings.get("appearance")));
            case "user_directory" -> saveAppMap(
                    applicationId,
                    settingKey,
                    UserDirectoryDefaults.merge(
                            UserDirectoryDefaults.platformDefaults(),
                            platformSettings.get("user_directory") != null
                                    ? platformSettings.get("user_directory")
                                    : Map.of()));
            case "public_manifest" -> {
                Map<String, Object> platform = platformSettings.get("public_manifest_defaults");
                if (platform == null || platform.isEmpty()) {
                    platform = PublicManifestDefaults.platformDefaults();
                }
                saveAppRaw(applicationId, settingKey, new LinkedHashMap<>(platform));
            }
            case "token_policy" -> saveAppMap(applicationId, settingKey, new HashMap<>(platformTokenPolicy()));
            default -> throw new IllegalArgumentException("Unsupported setting key: " + settingKey);
        }
    }

    private void requireExposed(String sectionKey) {
        if (!exposure.isExposed(sectionKey)) {
            throw new IllegalArgumentException(
                    "This setting section is not enabled for applications. Enable it under Platform settings → For applications.");
        }
    }

    private boolean hasOverride(UUID applicationId, String key) {
        return appSettings.findByApplicationIdAndKey(applicationId, key).isPresent();
    }

    private void saveAppMap(UUID applicationId, String key, Map<String, Object> value) {
        Map<String, Object> cleaned = new HashMap<>(value != null ? value : Map.of());
        cleaned.remove("scope");
        cleaned.remove("inheritsPlatformDefaults");
        cleaned.remove("smtpConfigured");
        cleaned.remove("platformExposed");
        saveAppRaw(applicationId, key, cleaned);
    }

    private void saveAppRaw(UUID applicationId, String key, Object value) {
        ApplicationSetting row = appSettings
                .findByApplicationIdAndKey(applicationId, key)
                .orElseGet(() -> {
                    ApplicationSetting created = new ApplicationSetting();
                    created.setApplicationId(applicationId);
                    created.setKey(key);
                    return created;
                });
        row.setValue(value);
        appSettings.save(row);
    }

    @SuppressWarnings("unchecked")
    private java.util.Optional<Map<String, Object>> getAppMap(UUID applicationId, String key) {
        Object raw = getAppRaw(applicationId, key);
        if (raw instanceof Map<?, ?> map) {
            return java.util.Optional.of((Map<String, Object>) map);
        }
        return java.util.Optional.empty();
    }

    private Object getAppRaw(UUID applicationId, String key) {
        return appSettings.findByApplicationIdAndKey(applicationId, key).map(ApplicationSetting::getValue).orElse(null);
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> mergeList(List<Map<String, Object>> platform, Object appOverride) {
        if (!(appOverride instanceof List<?> appList) || appList.isEmpty()) {
            return copyList(platform);
        }
        Map<String, Map<String, Object>> byId = new LinkedHashMap<>();
        for (Map<String, Object> item : platform) {
            String id = String.valueOf(item.get("id"));
            if (id == null || "null".equals(id)) {
                continue;
            }
            byId.put(id, new HashMap<>(item));
        }
        for (Object raw : appList) {
            if (raw instanceof Map<?, ?> row) {
                String id = String.valueOf(row.get("id"));
                Map<String, Object> patch = (Map<String, Object>) row;
                if (byId.containsKey(id)) {
                    byId.get(id).putAll(patch);
                } else {
                    byId.put(id, new HashMap<>(patch));
                }
            }
        }
        return new ArrayList<>(byId.values());
    }

    private static List<Map<String, Object>> copyList(List<Map<String, Object>> source) {
        List<Map<String, Object>> copy = new ArrayList<>();
        for (Map<String, Object> item : source) {
            copy.add(new HashMap<>(item));
        }
        return copy;
    }

    private static List<Map<String, Object>> stripMeta(List<Map<String, Object>> body) {
        for (Map<String, Object> row : body) {
            row.remove("inheritsPlatformDefaults");
            row.remove("scope");
        }
        return body;
    }

    /** Resolved settings for public manifest (no admin exposure gate). */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> resolveAuthMethods(UUID applicationId) {
        requireApplication(applicationId);
        return mergeList(authSettings.getAuthMethods(), getAppRaw(applicationId, "auth_methods"));
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> resolveFeatureFlags(UUID applicationId) {
        requireApplication(applicationId);
        return FeatureFlagMerge.merge(
                authSettings.getFeatureFlags(), getAppRaw(applicationId, "feature_flags"));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> resolvePasswordPolicy(UUID applicationId) {
        requireApplication(applicationId);
        Map<String, Object> merged = new HashMap<>(authSettings.getPasswordPolicy());
        getAppMap(applicationId, "password_policy").ifPresent(merged::putAll);
        return merged;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> resolveAppearance(UUID applicationId) {
        requireApplication(applicationId);
        return ClientAppearanceDefaults.merge(
                ClientAppearanceDefaults.platformDefaults(),
                getAppMap(applicationId, "appearance").orElse(Map.of()));
    }
}
