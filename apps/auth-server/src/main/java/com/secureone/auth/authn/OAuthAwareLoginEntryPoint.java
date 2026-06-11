package com.secureone.auth.authn;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.savedrequest.RequestCache;
/** Sends users to the hosted login page while preserving the OAuth authorize URL. */
public class OAuthAwareLoginEntryPoint implements AuthenticationEntryPoint {

    private final RequestCache requestCache;

    public OAuthAwareLoginEntryPoint(RequestCache requestCache) {
        this.requestCache = requestCache;
    }

    @Override
    public void commence(
            HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
            throws IOException {
        String authorizeUrl = OAuthLoginRedirectSupport.buildAuthorizeUrl(request);
        if (OAuthLoginRedirectSupport.isAuthorizeUrl(authorizeUrl)) {
            requestCache.saveRequest(request, response);
            response.sendRedirect(OAuthLoginRedirectSupport.loginPageWithContinue(authorizeUrl));
            return;
        }
        response.sendRedirect("/login.html");
    }
}
