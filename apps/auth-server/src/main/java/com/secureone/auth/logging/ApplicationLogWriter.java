package com.secureone.auth.logging;

import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.classic.spi.IThrowableProxy;
import ch.qos.logback.classic.spi.ThrowableProxyUtil;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.springframework.stereotype.Component;

@Component
public class ApplicationLogWriter {

    private static ApplicationLogWriter instance;

    private final ApplicationLogRepository repository;
    private final ExecutorService executor = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "application-log-writer");
        t.setDaemon(true);
        return t;
    });

    public ApplicationLogWriter(ApplicationLogRepository repository) {
        this.repository = repository;
        instance = this;
    }

    public static ApplicationLogWriter getInstance() {
        return instance;
    }

    public void append(ILoggingEvent event) {
        executor.execute(() -> persist(event));
    }

    private void persist(ILoggingEvent event) {
        try {
            ApplicationLog row = new ApplicationLog();
            row.setLevel(event.getLevel().toString());
            row.setLogger(truncate(event.getLoggerName(), 256));
            row.setMessage(truncate(event.getFormattedMessage(), 8000));
            Map<String, String> mdc = event.getMDCPropertyMap();
            row.setSessionId(mdcVal(mdc, RequestContext.SESSION_ID));
            row.setRequestId(mdcVal(mdc, RequestContext.REQUEST_ID));
            row.setPrincipal(mdcVal(mdc, RequestContext.PRINCIPAL));
            row.setIp(mdcVal(mdc, RequestContext.CLIENT_IP));
            row.setUserAgent(mdcVal(mdc, RequestContext.USER_AGENT));
            row.setTenantId(parseUuid(mdcVal(mdc, "tenantId")));
            row.setApplicationId(parseUuid(mdcVal(mdc, RequestContext.APPLICATION_ID)));

            Map<String, Object> metadata = new HashMap<>();
            String tenantSlug = mdcVal(mdc, RequestContext.TENANT_SLUG);
            if (tenantSlug != null) {
                metadata.put("tenantSlug", tenantSlug);
            }
            enrichLoginDiagnostics(mdc, metadata);
            IThrowableProxy throwable = event.getThrowableProxy();
            if (throwable != null) {
                metadata.put(
                        "stackTrace",
                        truncate(ThrowableProxyUtil.asString(throwable), 4000));
            }
            row.setMetadata(metadata);
            repository.save(row);
        } catch (Exception ignored) {
            // Never recurse into logging failures.
        }
    }

    private static String mdcVal(Map<String, String> mdc, String key) {
        if (mdc == null) {
            return null;
        }
        String value = mdc.get(key);
        if (value == null || value.isBlank()) {
            return null;
        }
        return truncate(value, 320);
    }

    private static UUID parseUuid(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(raw);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }

    private static void enrichLoginDiagnostics(Map<String, String> mdc, Map<String, Object> metadata) {
        String reason = mdcVal(mdc, RequestContext.LOGIN_FAILURE_REASON);
        if (reason == null) {
            return;
        }
        metadata.put("event", "form_login_failure");
        metadata.put("failureReason", reason);
        putIfPresent(metadata, "failureDetail", mdcVal(mdc, RequestContext.LOGIN_FAILURE_DETAIL));

        Map<String, Object> request = new HashMap<>();
        putIfPresent(request, "method", mdcVal(mdc, RequestContext.HTTP_METHOD));
        putIfPresent(request, "path", mdcVal(mdc, RequestContext.REQUEST_PATH));
        putIfPresent(request, "query", mdcVal(mdc, RequestContext.QUERY_STRING));
        putIfPresent(request, "contentType", mdcVal(mdc, RequestContext.CONTENT_TYPE));
        if (!request.isEmpty()) {
            metadata.put("request", request);
        }

        Map<String, Object> payload = new HashMap<>();
        putIfPresent(payload, "tenant", mdcVal(mdc, RequestContext.LOGIN_TENANT));
        putIfPresent(payload, "email", mdcVal(mdc, RequestContext.LOGIN_EMAIL));
        putIfPresent(payload, "username", mdcVal(mdc, RequestContext.LOGIN_USERNAME));
        String passwordPresent = mdcVal(mdc, RequestContext.PASSWORD_PRESENT);
        if (passwordPresent != null) {
            payload.put("passwordPresent", Boolean.parseBoolean(passwordPresent));
        }
        String passwordLength = mdcVal(mdc, RequestContext.PASSWORD_LENGTH);
        if (passwordLength != null) {
            try {
                payload.put("passwordLength", Integer.parseInt(passwordLength));
            } catch (NumberFormatException ignored) {
                payload.put("passwordLength", passwordLength);
            }
        }
        if (!payload.isEmpty()) {
            metadata.put("payload", payload);
        }

        Map<String, Object> client = new HashMap<>();
        putIfPresent(client, "ip", mdcVal(mdc, RequestContext.CLIENT_IP));
        putIfPresent(client, "forwardedFor", mdcVal(mdc, RequestContext.FORWARDED_FOR));
        putIfPresent(client, "userAgent", mdcVal(mdc, RequestContext.USER_AGENT));
        putIfPresent(client, "referer", mdcVal(mdc, RequestContext.REFERER));
        if (!client.isEmpty()) {
            metadata.put("client", client);
        }
    }

    private static void putIfPresent(Map<String, Object> target, String key, String value) {
        if (value != null && !value.isBlank()) {
            target.put(key, value);
        }
    }
}
