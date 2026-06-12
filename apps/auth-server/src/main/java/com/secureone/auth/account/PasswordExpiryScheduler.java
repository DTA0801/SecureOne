package com.secureone.auth.account;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "secureone.password-expiry.scheduler-enabled", havingValue = "true", matchIfMissing = true)
public class PasswordExpiryScheduler {

    private static final Logger log = LoggerFactory.getLogger(PasswordExpiryScheduler.class);

    private final PasswordExpiryService expiry;

    public PasswordExpiryScheduler(PasswordExpiryService expiry) {
        this.expiry = expiry;
    }

    @Scheduled(cron = "${secureone.password-expiry.check-cron:0 0 */6 * * *}")
    public void checkPasswordExpiryNotifications() {
        try {
            int sent = expiry.processScheduledNotifications();
            if (sent > 0) {
                log.info("Password expiry job sent {} notification(s)", sent);
            }
        } catch (RuntimeException ex) {
            log.warn("Password expiry notification job failed: {}", ex.getMessage());
        }
    }
}
