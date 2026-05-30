-- Which platform setting sections applications may customize.

INSERT INTO platform_setting (key, value)
VALUES (
    'app_settings_exposure',
    '{
      "notifications": true,
      "email": true,
      "auth-methods": true,
      "password-policy": true,
      "feature-flags": true,
      "appearance": false
    }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
