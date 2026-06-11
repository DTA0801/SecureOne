-- Remove leftover dev sample rows (audit/login history have no tenant FK CASCADE).

DELETE FROM audit_log
WHERE tenant_id IN ('11111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111102')
   OR id IN (
       'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
       'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'
   );

DELETE FROM login_history
WHERE tenant_id IN ('11111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111102')
   OR id IN (
       'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
       'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2'
   );

-- Ensure notification recipients are empty after dev tenant removal.
UPDATE platform_setting
SET value = jsonb_set(COALESCE(value, '{}'::jsonb), '{adminRecipients}', '[]'::jsonb, true),
    updated_at = now()
WHERE key = 'notifications';
