package com.secureone.auth.account;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/** Builds public requirement labels and evaluates passwords against a policy map. */
public final class PasswordPolicyRules {

    private PasswordPolicyRules() {}

    public static Map<String, Object> publicPolicy(Map<String, Object> policy) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("minLength", number(policy, "minLength", 12));
        out.put("requireUppercase", bool(policy, "requireUppercase"));
        out.put("requireNumber", bool(policy, "requireNumber"));
        out.put("requireSymbol", bool(policy, "requireSymbol"));
        out.put("expiryDays", number(policy, "expiryDays", 0));
        out.put("historyCount", number(policy, "historyCount", 0));
        out.put("requirements", requirements(policy));
        return out;
    }

    public static Map<String, Object> signupPolicy(Map<String, Object> policy) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("minLength", number(policy, "minLength", 12));
        out.put("requireUppercase", bool(policy, "requireUppercase"));
        out.put("requireNumber", bool(policy, "requireNumber"));
        out.put("requireSymbol", bool(policy, "requireSymbol"));
        out.put("requirements", requirements(policy));
        return out;
    }

    public static List<Map<String, Object>> requirements(Map<String, Object> policy) {
        List<Map<String, Object>> rules = new ArrayList<>();
        int minLength = number(policy, "minLength", 12);
        rules.add(rule("minLength", "At least " + minLength + " characters"));
        if (bool(policy, "requireUppercase")) {
            rules.add(rule("uppercase", "One uppercase letter (A–Z)"));
        }
        if (bool(policy, "requireNumber")) {
            rules.add(rule("number", "One number (0–9)"));
        }
        if (bool(policy, "requireSymbol")) {
            rules.add(rule("symbol", "One symbol (!@#$… )"));
        }
        return rules;
    }

    public static void validate(String password, Map<String, Object> policy) {
        if (password == null) {
            throw new IllegalArgumentException("Password is required.");
        }
        int minLength = number(policy, "minLength", 12);
        if (password.length() < minLength) {
            throw new IllegalArgumentException("Password must be at least " + minLength + " characters.");
        }
        if (bool(policy, "requireUppercase") && !Pattern.compile("[A-Z]").matcher(password).find()) {
            throw new IllegalArgumentException("Password must include an uppercase letter.");
        }
        if (bool(policy, "requireNumber") && !Pattern.compile("[0-9]").matcher(password).find()) {
            throw new IllegalArgumentException("Password must include a number.");
        }
        if (bool(policy, "requireSymbol") && !Pattern.compile("[^a-zA-Z0-9]").matcher(password).find()) {
            throw new IllegalArgumentException("Password must include a symbol.");
        }
    }

    public static List<Map<String, Object>> evaluate(String password, Map<String, Object> policy) {
        String value = password != null ? password : "";
        List<Map<String, Object>> out = new ArrayList<>();
        int minLength = number(policy, "minLength", 12);
        out.add(evaluation("minLength", "At least " + minLength + " characters", value.length() >= minLength));
        if (bool(policy, "requireUppercase")) {
            out.add(evaluation(
                    "uppercase",
                    "One uppercase letter (A–Z)",
                    Pattern.compile("[A-Z]").matcher(value).find()));
        }
        if (bool(policy, "requireNumber")) {
            out.add(evaluation(
                    "number", "One number (0–9)", Pattern.compile("[0-9]").matcher(value).find()));
        }
        if (bool(policy, "requireSymbol")) {
            out.add(evaluation(
                    "symbol",
                    "One symbol (!@#$… )",
                    Pattern.compile("[^a-zA-Z0-9]").matcher(value).find()));
        }
        return out;
    }

    private static Map<String, Object> rule(String key, String label) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("key", key);
        row.put("label", label);
        return row;
    }

    private static Map<String, Object> evaluation(String key, String label, boolean met) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("key", key);
        row.put("label", label);
        row.put("met", met);
        return row;
    }

    private static int number(Map<String, Object> map, String key, int fallback) {
        Object v = map.get(key);
        if (v instanceof Number n) {
            return n.intValue();
        }
        return fallback;
    }

    private static boolean bool(Map<String, Object> map, String key) {
        return Boolean.TRUE.equals(map.get(key));
    }
}
