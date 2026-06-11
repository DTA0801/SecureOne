package com.secureone.auth.authn;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import org.springframework.security.web.savedrequest.HttpSessionRequestCache;
import org.springframework.security.web.savedrequest.RequestCache;
import org.springframework.security.web.savedrequest.SavedRequest;
import org.springframework.web.util.UriComponentsBuilder;

/** Preserves OAuth authorize URLs across the hosted login page. */
public final class OAuthLoginRedirectSupport {

    public static final String CONTINUE_PARAM = "continue";
    public static final String CONTINUE_FIELD = "continue";

    private OAuthLoginRedirectSupport() {}

    public static String buildAuthorizeUrl(HttpServletRequest request) {
        String query = request.getQueryString();
        if (query == null || query.isBlank()) {
            return request.getRequestURL().toString();
        }
        return request.getRequestURL() + "?" + query;
    }

    public static String loginPageWithContinue(String authorizeUrl) {
        return "/login.html?"
                + CONTINUE_PARAM
                + "="
                + URLEncoder.encode(authorizeUrl, StandardCharsets.UTF_8);
    }

    public static boolean isAuthorizeUrl(String url) {
        if (url == null || url.isBlank()) {
            return false;
        }
        try {
            URI uri = URI.create(url);
            String path = uri.getPath();
            return path != null && path.contains("/oauth2/authorize");
        } catch (IllegalArgumentException ex) {
            return url.contains("/oauth2/authorize");
        }
    }

    public static String readContinueParam(HttpServletRequest request) {
        String raw = request.getParameter(CONTINUE_FIELD);
        if (raw == null || raw.isBlank()) {
            raw = request.getParameter(CONTINUE_PARAM);
        }
        return isAuthorizeUrl(raw) ? raw.trim() : null;
    }

    public static String resolvePendingAuthorizeUrl(
            HttpServletRequest request, HttpServletResponse response, RequestCache requestCache) {
        String fromParam = readContinueParam(request);
        if (fromParam != null) {
            return fromParam;
        }
        SavedRequest saved = requestCache.getRequest(request, response);
        if (saved == null) {
            return null;
        }
        String target = saved.getRedirectUrl();
        return isAuthorizeUrl(target) ? target : null;
    }

    public static String appendContinueToLoginUrl(String loginUrl, String authorizeUrl) {
        if (!isAuthorizeUrl(authorizeUrl)) {
            return loginUrl;
        }
        return UriComponentsBuilder.fromUriString(loginUrl)
                .queryParam(CONTINUE_PARAM, authorizeUrl)
                .build(true)
                .toUriString();
    }

    public static RequestCache requestCache() {
        HttpSessionRequestCache cache = new HttpSessionRequestCache();
        cache.setRequestMatcher(
                request -> request.getRequestURI() != null && request.getRequestURI().contains("/oauth2/authorize"));
        return cache;
    }
}
