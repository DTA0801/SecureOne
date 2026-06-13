-- Re-seed platform_setting rows if the table was truncated manually (Flyway history unchanged).

INSERT INTO platform_setting (key, value)
VALUES
    ('notifications', '{
      "emailEnabled": true,
      "auditAlertsEnabled": true,
      "securityAlertsEnabled": true,
      "adminRecipients": []
    }'::jsonb),
    ('email', '{
      "fromName": "SecureOne",
      "fromAddress": "noreply@secureone.local",
      "replyTo": "support@secureone.local"
    }'::jsonb),
    ('smtp', '{
      "host": "",
      "port": 465,
      "security": "ssl",
      "username": "",
      "authEnabled": true
    }'::jsonb),
    ('email_templates', '{}'::jsonb),
    ('app_settings_exposure', '{
      "notifications": true,
      "email": true,
      "auth-methods": true,
      "password-policy": true,
      "feature-flags": true,
      "appearance": false,
      "user-directory": true,
      "public-manifest": true,
      "token-policy": true
    }'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO platform_setting (key, value)
VALUES
    ('auth_methods', '[
      {"id":"m_password","name":"Password","description":"Username + password","enabled":true,"category":"primary","implemented":true},
      {"id":"m_passkey","name":"Passkeys (WebAuthn)","description":"Phishing-resistant sign-in","enabled":true,"category":"primary","implemented":false},
      {"id":"m_magic","name":"Magic Link","description":"Email passwordless login","enabled":true,"category":"primary","implemented":true},
      {"id":"m_totp","name":"TOTP Authenticator","description":"Authenticator app codes","enabled":true,"category":"mfa","implemented":false},
      {"id":"m_sms","name":"SMS OTP","description":"SMS one-time codes","enabled":false,"category":"mfa","implemented":false},
      {"id":"m_email_otp","name":"Email OTP","description":"Email one-time codes at login","enabled":true,"category":"mfa","implemented":false},
      {"id":"m_push","name":"Push Notification","description":"Approve on device","enabled":false,"category":"mfa","implemented":false},
      {"id":"m_google","name":"Google","description":"Google OIDC","enabled":true,"category":"federation","implemented":false},
      {"id":"m_github","name":"GitHub","description":"GitHub OAuth","enabled":true,"category":"federation","implemented":false},
      {"id":"m_saml","name":"SAML 2.0","description":"Enterprise SSO","enabled":false,"category":"federation","implemented":false},
      {"id":"m_oidc","name":"External OIDC","description":"OIDC federation","enabled":false,"category":"federation","implemented":false}
    ]'::jsonb),
    ('password_policy', '{
      "minLength": 12,
      "requireUppercase": true,
      "requireNumber": true,
      "requireSymbol": true,
      "expiryDays": 0,
      "historyCount": 5,
      "hashAlgorithm": "bcrypt"
    }'::jsonb),
    ('feature_flags', '[
      {"key":"self_service_recovery","name":"Self-service Recovery","description":"Application-scoped forgot-password","enabled":true,"rollout":100,"category":"identity"},
      {"key":"self_registration","name":"Self Registration","description":"Public user signup","enabled":false,"rollout":0,"category":"identity"},
      {"key":"ldap","name":"LDAP / AD","description":"LDAP user import","enabled":false,"rollout":0,"category":"identity"},
      {"key":"notification_email_test_ui","name":"Email test console","description":"SMTP test panel under Notifications","enabled":true,"rollout":100,"category":"notifications"}
    ]'::jsonb),
    ('user_directory', '{
      "importEnabled": false,
      "exportEnabled": false,
      "sources": {"csv": {"enabled": true}, "excel": {"enabled": true}, "ldap": {"enabled": false}},
      "ldap": {"host": "", "port": 389, "baseDn": "", "bindDn": "", "bindPassword": "", "userFilter": "(mail={0})", "useTls": true}
    }'::jsonb),
    ('public_manifest_defaults', '{
      "enabled": false,
      "sections": {"application": true, "authMethods": true, "featureFlags": true, "passwordPolicy": true, "appearance": false},
      "authMethodsOnlyEnabled": true
    }'::jsonb),
    ('token_policy', '{
      "accessTokenTtlSeconds": 3600,
      "refreshTokenTtlSeconds": 604800,
      "authorizationCodeTtlSeconds": 300,
      "idTokenTtlSeconds": 3600,
      "clientCredentialsTtlSeconds": 3600,
      "deviceCodeTtlSeconds": 600,
      "refreshTokensEnabled": true,
      "reuseRefreshTokens": false,
      "rotateRefreshTokens": true,
      "refreshTokenReuseDetection": true
    }'::jsonb),
    ('appearance', '{}'::jsonb)
ON CONFLICT (key) DO NOTHING;
