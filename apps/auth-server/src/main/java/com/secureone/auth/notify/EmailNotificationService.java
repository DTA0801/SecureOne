package com.secureone.auth.notify;

import com.secureone.auth.platform.PlatformSettingsService;
import com.secureone.auth.user.UserAccount;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailNotificationService {

    private final JavaMailSender mailSender;
    private final PlatformSettingsService settings;
    private final boolean mailConfigured;

    public EmailNotificationService(
            Optional<JavaMailSender> mailSender,
            PlatformSettingsService settings,
            @Value("${spring.mail.host:}") String mailHost) {
        this.mailSender = mailSender.orElse(null);
        this.settings = settings;
        this.mailConfigured = mailSender.isPresent() && mailHost != null && !mailHost.isBlank();
    }

    public boolean isMailConfigured() {
        return mailConfigured;
    }

    public Map<String, Object> getNotificationSettings() {
        return getSetting("notifications");
    }

    public Map<String, Object> getEmailSettings() {
        return getSetting("email");
    }

    public Map<String, Object> saveNotificationSettings(Map<String, Object> value) {
        return saveSetting("notifications", value);
    }

    public Map<String, Object> saveEmailSettings(Map<String, Object> value) {
        return saveSetting("email", value);
    }

    public void sendTestEmail(String to) {
        requireMail();
        sendPlain(to, "SecureOne test notification", "This is a test email from SecureOne.\n\nIf you received this, SMTP/email notifications are working.");
    }

    /** Platform admin alerts (Settings → Admin recipients). */
    public void sendAdminNotification(String subject, String body) {
        Map<String, Object> notifications = getNotificationSettings();
        if (!Boolean.TRUE.equals(notifications.get("emailEnabled"))) {
            return;
        }
        sendToAdminRecipients(subject, body);
    }

    /** Security-related admin alerts (Settings → Security alerts). */
    public void sendAdminSecurityAlert(String subject, String body) {
        Map<String, Object> notifications = getNotificationSettings();
        if (!Boolean.TRUE.equals(notifications.get("emailEnabled"))) {
            return;
        }
        if (!Boolean.TRUE.equals(notifications.get("securityAlertsEnabled"))) {
            return;
        }
        sendToAdminRecipients("[SecureOne Security] " + subject, body);
    }

    /** End-user transactional email (verify, reset, password changed). */
    public void sendVerifyEmail(UserAccount user, String verifyLink) {
        if (!userEmailEnabled()) {
            return;
        }
        requireMail();
        String name = displayName(user);
        sendPlain(
                user.getEmail(),
                "Verify your SecureOne email",
                "Hello " + name + ",\n\n"
                        + "Please verify your email address by opening this link (valid 24 hours):\n\n"
                        + verifyLink
                        + "\n\n"
                        + "If you did not create this account, you can ignore this message.");
    }

    public void sendPasswordReset(UserAccount user, String resetLink) {
        if (!userEmailEnabled()) {
            return;
        }
        requireMail();
        String name = displayName(user);
        sendPlain(
                user.getEmail(),
                "Reset your SecureOne password",
                "Hello " + name + ",\n\n"
                        + "We received a request to reset your password. Open this link (valid 1 hour):\n\n"
                        + resetLink
                        + "\n\n"
                        + "If you did not request this, ignore this email. Your password will not change.");
    }

    public void sendMagicLink(UserAccount user, String magicLink) {
        if (!userEmailEnabled()) {
            return;
        }
        requireMail();
        sendPlain(
                user.getEmail(),
                "Your SecureOne sign-in link",
                "Hello " + displayName(user) + ",\n\n"
                        + "Use this link to sign in (valid 1 hour):\n\n"
                        + magicLink
                        + "\n\n"
                        + "If you did not request this, ignore this email.");
    }

    public void sendSetPasswordInvite(UserAccount user, String setPasswordLink) {
        if (!userEmailEnabled()) {
            return;
        }
        requireMail();
        sendPlain(
                user.getEmail(),
                "Set your SecureOne password",
                "Hello " + displayName(user) + ",\n\n"
                        + "Your account was created. Set your password here (valid 1 hour):\n\n"
                        + setPasswordLink
                        + "\n\n"
                        + "Then sign in at " + setPasswordLink.replace("/account/set-password.html", "/login.html"));
    }

    public void sendPasswordChanged(UserAccount user) {
        if (!userEmailEnabled()) {
            return;
        }
        requireMail();
        String name = displayName(user);
        sendPlain(
                user.getEmail(),
                "Your SecureOne password was changed",
                "Hello " + name + ",\n\n"
                        + "Your password was successfully updated.\n\n"
                        + "If you did not make this change, contact your administrator immediately.");
    }

    private void sendToAdminRecipients(String subject, String body) {
        if (!mailConfigured) {
            return;
        }
        @SuppressWarnings("unchecked")
        List<String> recipients = (List<String>) getNotificationSettings().getOrDefault("adminRecipients", List.of());
        for (String recipient : recipients) {
            if (recipient != null && !recipient.isBlank()) {
                sendPlain(recipient.trim(), subject, body);
            }
        }
    }

    private void sendPlain(String to, String subject, String text) {
        if (!mailConfigured) {
            return;
        }
        Map<String, Object> email = getEmailSettings();
        String fromAddress = string(email, "fromAddress", "noreply@secureone.local");
        String fromName = string(email, "fromName", "SecureOne");
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromName + " <" + fromAddress + ">");
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        mailSender.send(message);
    }

    private boolean userEmailEnabled() {
        if (!mailConfigured) {
            return false;
        }
        Map<String, Object> notifications = getNotificationSettings();
        Object flag = notifications.get("userEmailEnabled");
        return flag == null || Boolean.TRUE.equals(flag);
    }

    private void requireMail() {
        if (!mailConfigured) {
            throw new IllegalStateException(
                    "SMTP is not configured. Set SECUREONE_SMTP_HOST (use MailHog on localhost:1025 for dev).");
        }
    }

    private Map<String, Object> getSetting(String key) {
        return settings.get(key);
    }

    private Map<String, Object> saveSetting(String key, Map<String, Object> value) {
        return settings.saveMap(key, value);
    }

    private static String string(Map<String, Object> map, String key, String defaultValue) {
        Object v = map.get(key);
        return v != null ? v.toString() : defaultValue;
    }

    private static String displayName(UserAccount user) {
        if (user.getDisplayName() != null && !user.getDisplayName().isBlank()) {
            return user.getDisplayName().trim();
        }
        return user.getEmail();
    }
}
