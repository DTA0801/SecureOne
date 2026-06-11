package com.secureone.auth.config.oauth;

import java.time.Instant;
import java.util.Base64;
import org.springframework.lang.Nullable;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.OAuth2RefreshToken;
import org.springframework.security.oauth2.server.authorization.OAuth2TokenType;
import org.springframework.security.oauth2.server.authorization.authentication.OAuth2ClientAuthenticationToken;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenContext;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenGenerator;

/**
 * Issues refresh tokens to public (PKCE) clients that include the refresh_token grant. Spring
 * Authorization Server skips refresh tokens for {@link ClientAuthenticationMethod#NONE} by default.
 */
public final class PublicClientRefreshTokenGenerator implements OAuth2TokenGenerator<OAuth2RefreshToken> {

    private final OAuth2TokenGenerator<OAuth2RefreshToken> defaultGenerator;

    public PublicClientRefreshTokenGenerator(OAuth2TokenGenerator<OAuth2RefreshToken> defaultGenerator) {
        this.defaultGenerator = defaultGenerator;
    }

    @Nullable
    @Override
    public OAuth2RefreshToken generate(OAuth2TokenContext context) {
        if (!OAuth2TokenType.REFRESH_TOKEN.equals(context.getTokenType())) {
            return null;
        }
        if (isAllowedPublicClient(context)) {
            Instant issuedAt = Instant.now();
            Instant expiresAt =
                    issuedAt.plus(context.getRegisteredClient().getTokenSettings().getRefreshTokenTimeToLive());
            String value = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes(72));
            return new OAuth2RefreshToken(value, issuedAt, expiresAt);
        }
        return defaultGenerator.generate(context);
    }

    private boolean isAllowedPublicClient(OAuth2TokenContext context) {
        if (!AuthorizationGrantType.AUTHORIZATION_CODE.equals(context.getAuthorizationGrantType())) {
            return false;
        }
        if (!(context.getAuthorizationGrant().getPrincipal() instanceof OAuth2ClientAuthenticationToken clientPrincipal)) {
            return false;
        }
        if (!ClientAuthenticationMethod.NONE.equals(clientPrincipal.getClientAuthenticationMethod())) {
            return false;
        }
        return context.getRegisteredClient().getAuthorizationGrantTypes().contains(AuthorizationGrantType.REFRESH_TOKEN);
    }

    private static byte[] randomBytes(int length) {
        byte[] bytes = new byte[length];
        new java.security.SecureRandom().nextBytes(bytes);
        return bytes;
    }
}
