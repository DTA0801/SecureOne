-- OAuth token policy (platform defaults + app exposure).

INSERT INTO platform_setting (key, value)
VALUES (
    'token_policy',
    '{
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
    }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

UPDATE platform_setting
SET value = value || '{"token-policy": true}'::jsonb
WHERE key = 'app_settings_exposure'
  AND NOT (value ? 'token-policy');
