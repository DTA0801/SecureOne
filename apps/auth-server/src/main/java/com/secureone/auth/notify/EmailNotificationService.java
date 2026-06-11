package com.secureone.auth.notify;

import com.secureone.auth.notify.ApplicationEmailContextFactory.ApplicationEmailContext;
import com.secureone.auth.notify.EmailTemplateService.RenderedEmail;
import com.secureone.auth.platform.PlatformSettingsService;
import com.secureone.auth.user.UserAccount;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailNotificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationService.class);

    private final PlatformSettingsService settings;
    private final ApplicationEmailContextFactory emailContext;
    private final EmailTemplateService templates;
    private final EmailDeliveryService delivery;
    private final boolean logLinksWhenUnavailable;

    public EmailNotificationService(
            PlatformSettingsService settings,
            ApplicationEmailContextFactory emailContext,
            EmailTemplateService templates,
            EmailDeliveryService delivery,
            @Value("${secureone.mail.log-links-when-smtp-unavailable:true}") boolean logLinksWhenUnavailable) {
        this.settings = settings;
        this.emailContext = emailContext;
        this.templates = templates;
        this.delivery = delivery;
        this.logLinksWhenUnavailable = logLinksWhenUnavailable;
    }

    public boolean isMailConfigured(UUID applicationId) {
        return applicationId != null && delivery.isConfigured(applicationId);
    }

    public boolean isUserTransactionalEmailEnabled(UUID applicationId) {
        ApplicationEmailContext ctx = emailContext.context(applicationId);
        Object flag = ctx.notifications().get("userEmailEnabled");
        boolean settingOn = flag == null || Boolean.TRUE.equals(flag);
        return settingOn && (ctx.smtpConfigured() || logLinksWhenUnavailable);
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

    public void sendTestEmail(
            UUID applicationId,
            String to,
            List<String> cc,
            List<String> bcc,
            String templateKey,
            Map<String, String> customData) {
        ApplicationEmailContext ctx = emailContext.context(applicationId);
        requireMail(ctx);
        String key = templateKey != null && !templateKey.isBlank() ? templateKey : "test";
        Map<String, String> vars = baseVariables(ctx);
        if (customData != null) {
            vars.putAll(customData);
        }
        vars.putIfAbsent("userName", "SecureOne Admin");
        vars.putIfAbsent("customMessage", "Test message from SecureOne admin console.");
        RenderedEmail rendered = templates
                .render(applicationId, key, vars)
                .withExtraRecipients(
                        EmailRecipientResolver.resolve(ctx.notifications(), cc),
                        EmailRecipientResolver.resolve(ctx.notifications(), bcc));
        sendOrLog(ctx, to, rendered.cc(), rendered.bcc(), rendered.subject(), rendered.bodyText(), rendered.bodyHtml());
    }

    public void sendAdminNotification(UUID applicationId, String subject, String body) {
        sendAdminNotification(applicationId, null, subject, body);
    }

    public void sendAdminNotification(UUID applicationId, UserAccount user, String subject, String body) {
        UUID appId = emailContext.resolveApplicationId(applicationId, user);
        if (appId == null) {
            log.warn("Skipping admin notification (no application SMTP context): {}", subject);
            return;
        }
        ApplicationEmailContext ctx = emailContext.context(appId);
        if (!Boolean.TRUE.equals(ctx.notifications().get("emailEnabled"))) {
            return;
        }
        Map<String, String> vars = baseVariables(ctx);
        vars.put("subject", subject);
        vars.put("body", body);
        sendTemplatedToRecipients(
                ctx, "admin_notification", vars, adminRecipientEmails(ctx.notifications()), List.of(), List.of());
    }

    public void sendAdminSecurityAlert(UUID applicationId, String subject, String body) {
        sendAdminSecurityAlert(applicationId, null, subject, body);
    }

    public void sendAdminSecurityAlert(UUID applicationId, UserAccount user, String subject, String body) {
        UUID appId = emailContext.resolveApplicationId(applicationId, user);
        if (appId == null) {
            log.warn("Skipping admin security alert (no application SMTP context): {}", subject);
            return;
        }
        ApplicationEmailContext ctx = emailContext.context(appId);
        if (!Boolean.TRUE.equals(ctx.notifications().get("emailEnabled"))) {
            return;
        }
        if (!Boolean.TRUE.equals(ctx.notifications().get("securityAlertsEnabled"))) {
            return;
        }
        Map<String, String> vars = baseVariables(ctx);
        vars.put("subject", subject);
        vars.put("body", body);
        sendTemplatedToRecipients(
                ctx, "admin_security_alert", vars, adminRecipientEmails(ctx.notifications()), List.of(), List.of());
    }

    public void sendAccountSuspended(UUID applicationId, UserAccount user) {
        sendAccountStatusEmail(applicationId, user, "account_suspended");
    }

    public void sendAccountReactivated(UUID applicationId, UserAccount user) {
        sendAccountStatusEmail(applicationId, user, "account_reactivated");
    }

    public void sendVerifyEmail(UUID applicationId, UserAccount user, String verifyLink) {
        UUID appId = emailContext.resolveApplicationId(applicationId, user);
        ensureUserTransactionalEmailEnabled(appId);
        sendUserTemplate(appId, user, "verify_email", verifyLink);
    }

    public void sendPasswordReset(UUID applicationId, UserAccount user, String resetLink) {
        UUID appId = emailContext.resolveApplicationId(applicationId, user);
        ensureUserTransactionalEmailEnabled(appId);
        sendUserTemplate(appId, user, "password_reset", resetLink);
    }

    public void sendMagicLink(UUID applicationId, UserAccount user, String magicLink) {
        UUID appId = emailContext.resolveApplicationId(applicationId, user);
        ensureUserTransactionalEmailEnabled(appId);
        sendUserTemplate(appId, user, "magic_link", magicLink);
    }

    public void sendSetPasswordInvite(UUID applicationId, UserAccount user, String setPasswordLink) {
        UUID appId = emailContext.resolveApplicationId(applicationId, user);
        ensureUserTransactionalEmailEnabled(appId);
        sendUserTemplate(appId, user, "set_password_invite", setPasswordLink);
    }

    public void sendPasswordChanged(UUID applicationId, UserAccount user) {
        UUID appId = emailContext.resolveApplicationId(applicationId, user);
        ensureUserTransactionalEmailEnabled(appId);
        ApplicationEmailContext ctx = emailContext.context(appId);
        Map<String, String> vars = userVariables(ctx, user, null);
        sendTemplated(ctx, user.getEmail(), "password_changed", vars, List.of(), List.of());
    }

    private void sendUserTemplate(UUID applicationId, UserAccount user, String templateKey, String actionLink) {
        ApplicationEmailContext ctx = emailContext.context(applicationId);
        Map<String, String> vars = userVariables(ctx, user, actionLink);
        sendTemplated(ctx, user.getEmail(), templateKey, vars, List.of(), List.of());
    }

    private void sendTemplated(
            ApplicationEmailContext ctx,
            String to,
            String templateKey,
            Map<String, String> vars,
            List<String> cc,
            List<String> bcc) {
        RenderedEmail rendered = templates
                .render(ctx.applicationId(), templateKey, vars)
                .withExtraRecipients(cc, bcc);
        sendOrLog(ctx, to, rendered.cc(), rendered.bcc(), rendered.subject(), rendered.bodyText(), rendered.bodyHtml());
    }

    private void sendAccountStatusEmail(UUID applicationId, UserAccount user, String templateKey) {
        UUID appId = emailContext.resolveApplicationId(applicationId, user);
        if (appId == null) {
            log.warn("Cannot send {} to {} — no application SMTP context", templateKey, user.getEmail());
            return;
        }
        ApplicationEmailContext ctx = emailContext.context(appId);
        if (!ctx.smtpConfigured() && !logLinksWhenUnavailable) {
            log.warn("Cannot send {} to {} — SMTP not configured for application {}", templateKey, user.getEmail(), appId);
            return;
        }
        Map<String, String> vars = userVariables(ctx, user, null);
        sendTemplated(ctx, user.getEmail(), templateKey, vars, List.of(), List.of());
    }

    private void sendTemplatedToRecipients(
            ApplicationEmailContext ctx,
            String templateKey,
            Map<String, String> vars,
            List<String> recipients,
            List<String> cc,
            List<String> bcc) {
        if (recipients.isEmpty()) {
            log.warn(
                    "No admin recipients configured for application {} — enable Notifications and add admin recipients",
                    ctx.applicationId());
            return;
        }
        if (!ctx.smtpConfigured() && !logLinksWhenUnavailable) {
            return;
        }
        RenderedEmail rendered = templates
                .render(ctx.applicationId(), templateKey, vars)
                .withExtraRecipients(cc, bcc);
        for (String recipient : recipients) {
            sendOrLog(
                    ctx,
                    recipient,
                    rendered.cc(),
                    rendered.bcc(),
                    rendered.subject(),
                    rendered.bodyText(),
                    rendered.bodyHtml());
        }
    }

    private void sendOrLog(
            ApplicationEmailContext ctx,
            String to,
            List<String> cc,
            List<String> bcc,
            String subject,
            String text,
            String html) {
        if (!ctx.smtpConfigured()) {
            if (logLinksWhenUnavailable) {
                log.warn(
                        """
                        SMTP unavailable — email logged to console instead of sent.
                        Application: {}
                        To: {}
                        Cc: {}
                        Bcc: {}
                        Subject: {}
                        Body:
                        {}
                        """,
                        ctx.applicationId(),
                        to,
                        cc,
                        bcc,
                        subject,
                        text);
            }
            return;
        }
        if (!cc.isEmpty() || !bcc.isEmpty()) {
            log.info("Email recipients application={} to={} cc={} bcc={}", ctx.applicationId(), to, cc, bcc);
        }
        try {
            delivery.send(ctx.applicationId(), ctx.email(), to, cc, bcc, subject, text, html);
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
            throw ex;
        }
    }

    private List<String> adminRecipientEmails(Map<String, Object> notifications) {
        Set<String> emails =
                new LinkedHashSet<>(SmtpSettingsService.parseEmailList(notifications.get("adminRecipients")));
        expandRecipientGroups(notifications, emails);
        return new ArrayList<>(emails);
    }

    @SuppressWarnings("unchecked")
    private void expandRecipientGroups(Map<String, Object> notifications, Set<String> emails) {
        Object groups = notifications.get("recipientGroups");
        if (!(groups instanceof Map<?, ?> groupMap)) {
            return;
        }
        for (Object members : groupMap.values()) {
            emails.addAll(SmtpSettingsService.parseEmailList(members));
        }
    }

    private Map<String, String> userVariables(
            ApplicationEmailContext ctx, UserAccount user, String actionLink) {
        Map<String, String> vars = baseVariables(ctx);
        vars.put("userName", displayName(user));
        vars.put("userEmail", user.getEmail());
        if (actionLink != null) {
            vars.put("actionLink", actionLink);
        }
        return vars;
    }

    private Map<String, String> baseVariables(ApplicationEmailContext ctx) {
        Map<String, String> vars = new HashMap<>();
        vars.put("appName", string(ctx.email(), "fromName", "SecureOne"));
        vars.put("tenantName", "SecureOne");
        return vars;
    }

    private void ensureUserTransactionalEmailEnabled(UUID applicationId) {
        if (applicationId == null) {
            throw new IllegalStateException(
                    "No application context for email. Configure SMTP under Application settings → Notifications.");
        }
        ApplicationEmailContext ctx = emailContext.context(applicationId);
        if (Boolean.FALSE.equals(ctx.notifications().get("userEmailEnabled"))) {
            throw new IllegalStateException(
                    "User transactional email is disabled in Application settings → Notifications.");
        }
        if (!ctx.smtpConfigured() && !logLinksWhenUnavailable) {
            requireMail(ctx);
        }
    }

    private void requireMail(ApplicationEmailContext ctx) {
        if (!ctx.smtpConfigured()) {
            throw new IllegalStateException(
                    "SMTP is not configured. Open Application settings → Notifications, save SMTP host/port/credentials, "
                            + "or set SECUREONE_MAIL_LOG_WHEN_UNAVAILABLE=true to print links in the server log.");
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
