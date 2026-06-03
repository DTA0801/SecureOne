-- Public (unauthenticated) application manifest: platform defaults and settings tab exposure.

INSERT INTO platform_setting (key, value)
VALUES (
    'public_manifest_defaults',
    '{
      "enabled": false,
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
ON CONFLICT (key) DO NOTHING;

UPDATE platform_setting
SET value = value || '{"public-manifest": true}'::jsonb
WHERE key = 'app_settings_exposure'
  AND NOT (value ? 'public-manifest');
