-- Remove dev seed tenants (acme, globex) and all dependent rows (CASCADE).
-- Platform super-admin remains in-memory (application config), not in these tables.

DELETE FROM tenant WHERE slug IN ('acme', 'globex');

-- Clear dev notification recipients from platform settings.
UPDATE platform_setting
SET value = jsonb_set(COALESCE(value, '{}'::jsonb), '{adminRecipients}', '[]'::jsonb, true),
    updated_at = now()
WHERE key = 'notifications';
