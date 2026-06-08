package com.secureone.auth.notify;

import com.secureone.auth.platform.PlatformSettingsService;
import com.secureone.auth.user.UserAccount;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailNotificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationService.class);

    private final JavaMailSender mailSender;
    private final PlatformSettingsService settings;
    private final boolean mailConfigured;
    private final boolean logLinksWhenUnavailable;

    public EmailNotificationService(
            Optional<JavaMailSender> mailSender,
            PlatformSettingsService settings,
            @Value("${spring.mail.host:}") String mailHost,
            @Value("${secureone.mail.log-links-when-smtp-unavailable:true}") boolean logLinksWhenUnavailable) {
        this.mailSender = mailSender.orElse(null);
        this.settings = settings;
        this.mailConfigured = mailSender.isPresent() && mailHost != null && !mailHost.isBlank();
        this.logLinksWhenUnavailable = logLinksWhenUnavailable;
    }

    public boolean isMailConfigured() {
        return mailConfigured;
    }

    /** Whether transactional user emails (verify, reset, magic link) may be sent or logged to console. */
    public boolean isUserTransactionalEmailEnabled() {
        Map<String, Object> notifications = getNotificationSettings();
        Object flag = notifications.get("userEmailEnabled");
        boolean settingOn = flag == null || Boolean.TRUE.equals(flag);
        return settingOn && (mailConfigured || logLinksWhenUnavailable);
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
        sendPlainOrThrow(
                to,
                "SecureOne test notification",
                "This is a test email from SecureOne.\n\nIf you received this, SMTP/email notifications are working.");
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
        ensureUserTransactionalEmailEnabled();
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
        ensureUserTransactionalEmailEnabled();
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
        ensureUserTransactionalEmailEnabled();
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
        ensureUserTransactionalEmailEnabled();
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
        ensureUserTransactionalEmailEnabled();
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
            if (logLinksWhenUnavailable) {
                log.warn(
                        """
                        SMTP unavailable — transactional email logged to console instead of sent.
                        To: {}
                        Subject: {}
                        Body:
                        {}
                        """,
                        to,
                        subject,
                        text);
            }
            return;
        }
        try {
            deliverPlain(to, subject, text);
        } catch (Exception ex) {
            if (logLinksWhenUnavailable) {
                log.warn(
                        "SMTP send failed ({}). Email logged to console instead.\nTo: {}\nSubject: {}\nBody:\n{}",
                        ex.getMessage(),
                        to,
                        subject,
                        text);
                return;
            }
            throw new IllegalStateException("Failed to send email via SMTP: " + ex.getMessage(), ex);
        }
    }

    private void sendPlainOrThrow(String to, String subject, String text) {
        requireMail();
        try {
            deliverPlain(to, subject, text);
        } catch (Exception ex) {
            throw new IllegalStateException(
                    "Failed to send test email via SMTP: "
                            + ex.getMessage()
                            + ". For Gmail, use an App Password (not your normal login password) in SECUREONE_SMTP_PASSWORD.",
                    ex);
        }
    }

    private void deliverPlain(String to, String subject, String text) {
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

    private void ensureUserTransactionalEmailEnabled() {
        Map<String, Object> notifications = getNotificationSettings();
        if (Boolean.FALSE.equals(notifications.get("userEmailEnabled"))) {
            throw new IllegalStateException(
                    "User transactional email is disabled in Platform settings → Notifications.");
        }
        if (!mailConfigured && !logLinksWhenUnavailable) {
            requireMail();
        }
    }

    private void requireMail() {
        if (!mailConfigured) {
            throw new IllegalStateException(
                    "SMTP is not configured. For local dev, start MailHog: "
                            + "docker compose -f deploy/docker-compose.yml up -d mailhog "
                            + "(SMTP localhost:1025, inbox http://localhost:8025). "
                            + "Or set SECUREONE_MAIL_LOG_WHEN_UNAVAILABLE=true to print links in the server log.");
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
