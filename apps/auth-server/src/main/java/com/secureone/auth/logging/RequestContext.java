package com.secureone.auth.logging;

/** MDC keys propagated into console and database log entries. */
public final class RequestContext {

    public static final String REQUEST_ID = "requestId";
    public static final String SESSION_ID = "sessionId";
    public static final String PRINCIPAL = "principal";
    public static final String TENANT_SLUG = "tenantSlug";
    public static final String APPLICATION_ID = "applicationId";
    public static final String CLIENT_IP = "clientIp";
    public static final String HTTP_METHOD = "httpMethod";
    public static final String REQUEST_PATH = "requestPath";
    public static final String QUERY_STRING = "queryString";
    public static final String USER_AGENT = "userAgent";
    public static final String REFERER = "referer";
    public static final String FORWARDED_FOR = "forwardedFor";
    public static final String CONTENT_TYPE = "contentType";
    public static final String LOGIN_FAILURE_REASON = "loginFailureReason";
    public static final String LOGIN_FAILURE_DETAIL = "loginFailureDetail";
    public static final String LOGIN_TENANT = "loginTenant";
    public static final String LOGIN_EMAIL = "loginEmail";
    public static final String LOGIN_USERNAME = "loginUsername";
    public static final String PASSWORD_PRESENT = "passwordPresent";
    public static final String PASSWORD_LENGTH = "passwordLength";

    private RequestContext() {}
}
