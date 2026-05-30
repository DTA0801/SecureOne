-- User directory import/export: platform defaults and app settings exposure.

INSERT INTO platform_setting (key, value)
VALUES (
    'user_directory',
    '{
      "importEnabled": false,
      "exportEnabled": false,
      "sources": {
        "csv": { "enabled": true },
        "excel": { "enabled": true },
        "ldap": { "enabled": false }
      },
      "ldap": {
        "host": "",
        "port": 389,
        "baseDn": "",
        "bindDn": "",
        "bindPassword": "",
        "userFilter": "(mail={0})",
        "useTls": true
      }
    }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

UPDATE platform_setting
SET value = value || '{"user-directory": true}'::jsonb
WHERE key = 'app_settings_exposure'
  AND NOT (value ? 'user-directory');
