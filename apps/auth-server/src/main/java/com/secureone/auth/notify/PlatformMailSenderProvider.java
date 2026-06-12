package com.secureone.auth.notify;

import com.secureone.auth.notify.SmtpSettingsService.SmtpConnectionConfig;
import java.util.Map;
import java.util.Optional;
import java.util.Properties;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Component;

@Component
public class PlatformMailSenderProvider {

    private final SmtpSettingsService smtpSettings;
    private final PlatformSmtpSettingsService platformSmtp;
    private final Map<UUID, CachedSender> cache = new ConcurrentHashMap<>();
    private volatile CachedSender platformCache;

    public PlatformMailSenderProvider(
            SmtpSettingsService smtpSettings, PlatformSmtpSettingsService platformSmtp) {
        this.smtpSettings = smtpSettings;
        this.platformSmtp = platformSmtp;
    }

    public Optional<JavaMailSender> getIfConfigured(UUID applicationId) {
        if (applicationId == null) {
            return Optional.empty();
        }
        SmtpConnectionConfig config = smtpSettings.loadConnectionConfig(applicationId);
        if (config == null) {
            return Optional.empty();
        }
        String hash = config.cacheKey(applicationId);
        CachedSender cached = cache.get(applicationId);
        if (cached != null && hash.equals(cached.hash)) {
            return Optional.of(cached.sender);
        }
        synchronized (cache) {
            cached = cache.get(applicationId);
            if (cached != null && hash.equals(cached.hash)) {
                return Optional.of(cached.sender);
            }
            JavaMailSender sender = build(config);
            cache.put(applicationId, new CachedSender(hash, sender));
            return Optional.of(sender);
        }
    }

    public Optional<JavaMailSender> getPlatformIfConfigured() {
        SmtpSettingsService.SmtpConnectionConfig config = platformSmtp.loadConnectionConfig();
        if (config == null) {
            return Optional.empty();
        }
        String hash = "platform:" + config.cacheKey(null);
        CachedSender cached = platformCache;
        if (cached != null && hash.equals(cached.hash)) {
            return Optional.of(cached.sender);
        }
        synchronized (this) {
            cached = platformCache;
            if (cached != null && hash.equals(cached.hash)) {
                return Optional.of(cached.sender);
            }
            JavaMailSender sender = build(config);
            platformCache = new CachedSender(hash, sender);
            return Optional.of(sender);
        }
    }

    public void invalidate(UUID applicationId) {
        if (applicationId != null) {
            cache.remove(applicationId);
        }
    }

    public void invalidatePlatform() {
        platformCache = null;
    }

    private static JavaMailSender build(SmtpConnectionConfig config) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(config.host());
        sender.setPort(config.port());
        sender.setUsername(config.username());
        sender.setPassword(config.password());

        Properties props = sender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", String.valueOf(config.authEnabled()));
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.timeout", "10000");
        props.put("mail.smtp.writetimeout", "10000");

        String security = config.security();
        if ("ssl".equals(security)) {
            props.put("mail.smtp.ssl.enable", "true");
            props.put("mail.smtp.socketFactory.port", String.valueOf(config.port()));
            props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
            props.put("mail.smtp.socketFactory.fallback", "false");
        } else if ("starttls".equals(security)) {
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.starttls.required", "true");
        }

        return sender;
    }

    private record CachedSender(String hash, JavaMailSender sender) {}
}
