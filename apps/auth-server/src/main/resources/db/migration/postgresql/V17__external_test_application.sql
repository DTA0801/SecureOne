-- OAuth SPA + public manifest/sign-up for testing SecureOne from apps outside this repo.

INSERT INTO application (id, tenant_id, name, slug, description, status, config, created_at, updated_at)
VALUES (
    '22222222-2222-2222-2222-222222222299',
    '11111111-1111-1111-1111-111111111101',
    'External Test Client',
    'external-test',
    'SPA/OAuth client for local and third-party integration testing',
    'ACTIVE',
    '{
      "type": "spa",
      "clientId": "external-test-client",
      "grantTypes": ["authorization_code", "refresh_token"],
      "scopes": ["openid", "profile", "email"],
      "redirectUris": [
        "http://127.0.0.1:5173/callback",
        "http://localhost:5173/callback",
        "http://127.0.0.1:3000/callback",
        "http://localhost:3000/callback",
        "http://127.0.0.1:8080/callback",
        "http://localhost:8080/callback"
      ],
      "postLogoutRedirectUris": [
        "http://127.0.0.1:5173/",
        "http://localhost:5173/"
      ],
      "pkceRequired": true,
      "tokenEndpointAuthMethod": "none"
    }'::jsonb,
    now(),
    now()
)
ON CONFLICT DO NOTHING;

INSERT INTO role (id, tenant_id, application_id, name, description, is_composite, is_default)
VALUES
    ('44444444-4444-4444-4444-444444444491', '11111111-1111-1111-1111-111111111101',
     '22222222-2222-2222-2222-222222222299', 'Super Admin', 'Full application control', true, false),
    ('44444444-4444-4444-4444-444444444492', '11111111-1111-1111-1111-111111111101',
     '22222222-2222-2222-2222-222222222299', 'Tenant Admin', 'Manage users and roles', false, false),
    ('44444444-4444-4444-4444-444444444493', '11111111-1111-1111-1111-111111111101',
     '22222222-2222-2222-2222-222222222299', 'Member', 'Standard end-user access', false, true)
ON CONFLICT DO NOTHING;

INSERT INTO role_composite (parent_role_id, child_role_id)
VALUES ('44444444-4444-4444-4444-444444444491', '44444444-4444-4444-4444-444444444492')
ON CONFLICT DO NOTHING;

INSERT INTO application_setting (application_id, setting_key, value)
VALUES
    (
        '22222222-2222-2222-2222-222222222299',
        'feature_flags',
        '[{"key":"self_registration","enabled":true,"rollout":100}]'::jsonb
    ),
    (
        '22222222-2222-2222-2222-222222222299',
        'public_manifest',
        '{
          "enabled": true,
          "sections": {
            "application": true,
            "authMethods": true,
            "featureFlags": true,
            "passwordPolicy": true,
            "appearance": false
          },
          "authMethodsOnlyEnabled": true
        }'::jsonb
    )
ON CONFLICT (application_id, setting_key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
