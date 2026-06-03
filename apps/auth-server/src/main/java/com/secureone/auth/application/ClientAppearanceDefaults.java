package com.secureone.auth.application;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Defaults for per-application client appearance (public manifest / embedded apps).
 * Separate from platform admin console theme ({@code platform_setting.appearance}).
 */
public final class ClientAppearanceDefaults {

    private ClientAppearanceDefaults() {}

    /** Keys exposed on the unauthenticated public manifest appearance block. */
    public static final List<String> PUBLIC_MANIFEST_KEYS = Collections.unmodifiableList(
            Arrays.asList(
                    "mode",
                    "primaryColor",
                    "buttonTextColor",
                    "accentColor",
                    "backgroundColor",
                    "surfaceColor",
                    "textColor",
                    "darkBackgroundColor",
                    "darkSurfaceColor",
                    "darkTextColor",
                    "gradientPreset",
                    "gradientFrom",
                    "gradientTo",
                    "gradientAngle",
                    "gradientScope",
                    "borderRadius",
                    "fontScale",
                    "notifyInfoBackground",
                    "notifyInfoText",
                    "notifyInfoBorder",
                    "notifySuccessBackground",
                    "notifySuccessText",
                    "notifySuccessBorder",
                    "notifyErrorBackground",
                    "notifyErrorText",
                    "notifyErrorBorder",
                    "appName",
                    "logoUrl",
                    "dialogBackground",
                    "dialogText",
                    "dialogBorder",
                    "dialogOverlay",
                    "inputBackground",
                    "inputText",
                    "inputBorder",
                    "inputPlaceholder",
                    "mutedText",
                    "dividerColor"));

    public static Map<String, Object> platformDefaults() {
        Map<String, Object> root = new LinkedHashMap<>();
        root.put("mode", "system");
        root.put("primaryColor", "#4f46e5");
        root.put("buttonTextColor", "#ffffff");
        root.put("accentColor", "#06b6d4");
        root.put("backgroundColor", "#f7f7f8");
        root.put("surfaceColor", "#ffffff");
        root.put("textColor", "#171717");
        root.put("darkBackgroundColor", "#121216");
        root.put("darkSurfaceColor", "#1c1c24");
        root.put("darkTextColor", "#ededed");
        root.put("gradientPreset", "none");
        root.put("gradientFrom", "#4f46e5");
        root.put("gradientTo", "#06b6d4");
        root.put("gradientAngle", 135);
        root.put("gradientScope", "both");
        root.put("borderRadius", 12);
        root.put("fontScale", 1);
        root.put("notifyInfoBackground", "#ffffff");
        root.put("notifyInfoText", "#171717");
        root.put("notifyInfoBorder", "#4f46e533");
        root.put("notifySuccessBackground", "#ecfdf5");
        root.put("notifySuccessText", "#065f46");
        root.put("notifySuccessBorder", "#10b98166");
        root.put("notifyErrorBackground", "#fef2f2");
        root.put("notifyErrorText", "#991b1b");
        root.put("notifyErrorBorder", "#ef444466");
        root.put("appName", "");
        root.put("logoUrl", "");
        root.put("dialogBackground", "#ffffff");
        root.put("dialogText", "#171717");
        root.put("dialogBorder", "#e5e7eb");
        root.put("dialogOverlay", "#00000066");
        root.put("inputBackground", "#ffffff");
        root.put("inputText", "#171717");
        root.put("inputBorder", "#d1d5db");
        root.put("inputPlaceholder", "#9ca3af");
        root.put("mutedText", "#6b7280");
        root.put("dividerColor", "#e5e7eb");
        return root;
    }

    public static Map<String, Object> merge(Map<String, Object> defaults, Map<String, Object> appOverride) {
        Map<String, Object> merged = new LinkedHashMap<>(defaults != null ? defaults : platformDefaults());
        if (appOverride == null || appOverride.isEmpty()) {
            return merged;
        }
        appOverride.forEach((k, v) -> {
            if (v == null || isMetaKey(k)) return;
            if (PUBLIC_MANIFEST_KEYS.contains(k)) {
                merged.put(k, v);
            }
        });
        return merged;
    }

    public static Map<String, Object> sanitizeForPublicManifest(Map<String, Object> appearance) {
        Map<String, Object> out = new LinkedHashMap<>();
        if (appearance == null) {
            return out;
        }
        for (String key : PUBLIC_MANIFEST_KEYS) {
            if (appearance.containsKey(key) && appearance.get(key) != null) {
                out.put(key, appearance.get(key));
            }
        }
        return out;
    }

    private static boolean isMetaKey(String key) {
        return "scope".equals(key) || "inheritsPlatformDefaults".equals(key);
    }

    /** Strip admin-only metadata before persisting application overrides. */
    public static Map<String, Object> stripMeta(Map<String, Object> body) {
        Map<String, Object> out = new HashMap<>(body);
        out.remove("scope");
        out.remove("inheritsPlatformDefaults");
        return out;
    }
}
