-- Dev roles and admin assignments for notification recipient picker.

INSERT INTO role (id, tenant_id, application_id, name, description, is_composite)
VALUES
    ('44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111101',
     '22222222-2222-2222-2222-222222222201', 'Super Admin',
     'Full platform control', true),
    ('44444444-4444-4444-4444-444444444402', '11111111-1111-1111-1111-111111111101',
     '22222222-2222-2222-2222-222222222201', 'Tenant Admin',
     'Manage users, roles, and applications', false),
    ('44444444-4444-4444-4444-444444444403', '11111111-1111-1111-1111-111111111101',
     '22222222-2222-2222-2222-222222222201', 'Member',
     'Standard end-user access', false)
ON CONFLICT DO NOTHING;

INSERT INTO role_composite (parent_role_id, child_role_id)
VALUES ('44444444-4444-4444-4444-444444444401', '44444444-4444-4444-4444-444444444402')
ON CONFLICT DO NOTHING;

INSERT INTO user_role (id, user_id, role_id, granted_at)
VALUES
    ('55555555-5555-5555-5555-555555555501', '33333333-3333-3333-3333-333333333301',
     '44444444-4444-4444-4444-444444444402', now())
ON CONFLICT (id) DO NOTHING;

UPDATE platform_setting
SET value = jsonb_set(
    value,
    '{adminRecipients}',
    '["sarah.chen@acme.com"]'::jsonb,
    true)
WHERE key = 'notifications';
