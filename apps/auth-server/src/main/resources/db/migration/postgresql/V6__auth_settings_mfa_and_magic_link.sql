-- MFA factors + default auth settings keys.

CREATE TABLE mfa_factor (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    type        VARCHAR(32) NOT NULL,
    label       VARCHAR(255),
    secret_encrypted BYTEA,
    verified    BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mfa_factor_user ON mfa_factor(user_id);

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
      {"key":"adaptive_mfa","name":"Adaptive MFA","description":"Risk-based step-up","enabled":true,"rollout":100},
      {"key":"device_trust","name":"Trusted Devices","description":"Remember devices","enabled":true,"rollout":100},
      {"key":"scim_provisioning","name":"SCIM Provisioning","description":"SCIM 2.0","enabled":false,"rollout":25},
      {"key":"dpop","name":"DPoP Tokens","description":"Sender-constrained tokens","enabled":false,"rollout":10},
      {"key":"self_service_recovery","name":"Self-service Recovery","description":"Password reset & magic link","enabled":true,"rollout":100},
      {"key":"self_registration","name":"Self Registration","description":"Public signup","enabled":false,"rollout":0},
      {"key":"social_login","name":"Social Login","description":"Google/GitHub/OIDC","enabled":true,"rollout":100},
      {"key":"saml","name":"SAML SSO","description":"SAML 2.0","enabled":false,"rollout":0},
      {"key":"ldap","name":"LDAP / AD","description":"Directory login","enabled":false,"rollout":0},
      {"key":"passwordless","name":"Passwordless Primary","description":"Passkey-first login","enabled":true,"rollout":100}
    ]'::jsonb)
ON CONFLICT (key) DO NOTHING;
