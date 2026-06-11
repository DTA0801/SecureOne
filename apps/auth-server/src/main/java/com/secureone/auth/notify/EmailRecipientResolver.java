package com.secureone.auth.notify;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class EmailRecipientResolver {

    private static final Logger log = LoggerFactory.getLogger(EmailRecipientResolver.class);

    public static final String ADMIN_TOKEN = "@admin";

    private EmailRecipientResolver() {}

    public static List<String> resolve(Map<String, Object> notifications, List<String> entries) {
        if (entries == null || entries.isEmpty()) {
            return List.of();
        }
        Set<String> emails = new LinkedHashSet<>();
        for (String entry : entries) {
            emails.addAll(expand(entry, notifications));
        }
        return new ArrayList<>(emails);
    }

    private static List<String> expand(String entry, Map<String, Object> notifications) {
        if (entry == null || entry.isBlank()) {
            return List.of();
        }
        String token = entry.trim();
        if (isAdminToken(token)) {
            return adminRecipientEmails(notifications);
        }
        String groupName = parseGroupToken(token);
        if (groupName != null) {
            return recipientGroupEmails(notifications, groupName);
        }
        if (looksLikeEmail(token)) {
            return List.of(token.toLowerCase(Locale.ROOT));
        }
        log.warn("Ignoring unrecognized email recipient entry: {}", token);
        return List.of();
    }

    static boolean isAdminToken(String token) {
        String normalized = token.toLowerCase(Locale.ROOT);
        return ADMIN_TOKEN.equalsIgnoreCase(token)
                || "@adminrecipients".equals(normalized)
                || "adminrecipients".equals(normalized)
                || "admin".equals(normalized);
    }

    static String parseGroupToken(String token) {
        String lower = token.toLowerCase(Locale.ROOT);
        if (lower.startsWith("@group:")) {
            String name = token.substring("@group:".length()).trim();
            return name.isEmpty() ? null : name;
        }
        if (lower.startsWith("group:")) {
            String name = token.substring("group:".length()).trim();
            return name.isEmpty() ? null : name;
        }
        return null;
    }

    private static boolean looksLikeEmail(String token) {
        return token.contains("@") && !token.startsWith("@");
    }

    @SuppressWarnings("unchecked")
    private static List<String> adminRecipientEmails(Map<String, Object> notifications) {
        if (notifications == null || notifications.isEmpty()) {
            return List.of();
        }
        return SmtpSettingsService.parseEmailList(notifications.get("adminRecipients"));
    }

    @SuppressWarnings("unchecked")
    private static List<String> recipientGroupEmails(Map<String, Object> notifications, String groupName) {
        if (notifications == null || notifications.isEmpty()) {
            return List.of();
        }
        Object groups = notifications.get("recipientGroups");
        if (!(groups instanceof Map<?, ?> groupMap)) {
            return List.of();
        }
        for (Map.Entry<?, ?> entry : groupMap.entrySet()) {
            if (entry.getKey() == null) {
                continue;
            }
            if (entry.getKey().toString().equalsIgnoreCase(groupName)) {
                return SmtpSettingsService.parseEmailList(entry.getValue());
            }
        }
        log.warn("Recipient group not found: {}", groupName);
        return List.of();
    }
}
