-- Trim feature flag catalog to keys with application runtime or admin UI effect.

UPDATE platform_setting
SET value = COALESCE(
    (
        SELECT jsonb_agg(elem ORDER BY elem->>'key')
        FROM jsonb_array_elements(value) AS elem
        WHERE elem->>'key' IN (
            'self_service_recovery',
            'self_registration',
            'ldap',
            'notification_email_test_ui'
        )
    ),
    '[]'::jsonb
)
WHERE key = 'feature_flags'
  AND jsonb_typeof(value) = 'array';

UPDATE application_setting
SET value = COALESCE(
    (
        SELECT jsonb_agg(elem ORDER BY elem->>'key')
        FROM jsonb_array_elements(value) AS elem
        WHERE elem->>'key' IN (
            'self_service_recovery',
            'self_registration',
            'ldap',
            'notification_email_test_ui'
        )
    ),
    '[]'::jsonb
)
WHERE setting_key = 'feature_flags'
  AND jsonb_typeof(value) = 'array';
