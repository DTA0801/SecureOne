package com.secureone.auth.authn;

import com.secureone.auth.application.Application;
import com.secureone.auth.application.ApplicationOAuthClientResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.savedrequest.RequestCache;
import org.springframework.web.util.UriComponentsBuilder;

/** Sends users to the hosted login page while preserving the OAuth authorize URL. */
public class OAuthAwareLoginEntryPoint implements AuthenticationEntryPoint {

    private final RequestCache requestCache;
    private final ApplicationOAuthClientResolver applications;

    public OAuthAwareLoginEntryPoint(RequestCache requestCache, ApplicationOAuthClientResolver applications) {
        this.requestCache = requestCache;
        this.applications = applications;
    }

    @Override
    public void commence(
            HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
            throws IOException {
        String authorizeUrl = OAuthLoginRedirectSupport.buildAuthorizeUrl(request);
        if (OAuthLoginRedirectSupport.isAuthorizeUrl(authorizeUrl)) {
            requestCache.saveRequest(request, response);
            String loginUrl = appendApplicationId(
                    OAuthLoginRedirectSupport.loginPageWithContinue(authorizeUrl), authorizeUrl);
            response.sendRedirect(loginUrl);
            return;
        }
        response.sendRedirect("/login.html");
    }

    private String appendApplicationId(String loginUrl, String authorizeUrl) {
        return resolveApplicationId(authorizeUrl)
                .map(appId -> UriComponentsBuilder.fromUriString(loginUrl)
                        .queryParam("applicationId", appId.toString())
                        .build(true)
                        .toUriString())
                .orElse(loginUrl);
    }

    private java.util.Optional<java.util.UUID> resolveApplicationId(String authorizeUrl) {
        String clientId = extractClientId(authorizeUrl);
        return applications.findActiveByOAuthClientId(clientId).map(Application::getId);
    }

    private static String extractClientId(String authorizeUrl) {
        if (authorizeUrl == null || authorizeUrl.isBlank()) {
            return null;
        }
        try {
            return UriComponentsBuilder.fromUriString(authorizeUrl)
                    .build(true)
                    .getQueryParams()
                    .getFirst("client_id");
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
