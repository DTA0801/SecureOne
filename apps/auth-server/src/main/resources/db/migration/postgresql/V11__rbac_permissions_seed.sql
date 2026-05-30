-- Enterprise RBAC: permission catalog, role labels, and default assignments.

UPDATE role SET is_system = true, is_default = false
WHERE id = '44444444-4444-4444-4444-444444444401';

UPDATE role SET is_system = true, is_default = true
WHERE id IN (
    '44444444-4444-4444-4444-444444444402',
    '44444444-4444-4444-4444-444444444403'
);

INSERT INTO permission (id, application_id, key, description)
VALUES
    ('66666666-6666-6666-6666-666666666601', '22222222-2222-2222-2222-222222222201', 'user:read', 'View users and profiles'),
    ('66666666-6666-6666-6666-666666666602', '22222222-2222-2222-2222-222222222201', 'user:write', 'Create and edit users'),
    ('66666666-6666-6666-6666-666666666603', '22222222-2222-2222-2222-222222222201', 'user:delete', 'Delete users'),
    ('66666666-6666-6666-6666-666666666604', '22222222-2222-2222-2222-222222222201', 'role:read', 'View roles and permissions'),
    ('66666666-6666-6666-6666-666666666605', '22222222-2222-2222-2222-222222222201', 'role:write', 'Manage roles and assignments'),
    ('66666666-6666-6666-6666-666666666606', '22222222-2222-2222-2222-222222222201', 'app:read', 'View applications'),
    ('66666666-6666-6666-6666-666666666607', '22222222-2222-2222-2222-222222222201', 'app:write', 'Manage OAuth clients'),
    ('66666666-6666-6666-6666-666666666608', '22222222-2222-2222-2222-222222222201', 'audit:read', 'View audit logs'),
    ('66666666-6666-6666-6666-666666666609', '22222222-2222-2222-2222-222222222201', 'settings:write', 'Change application settings'),
    ('66666666-6666-6666-6666-666666666610', '22222222-2222-2222-2222-222222222201', 'session:read', 'View active sessions')
ON CONFLICT (application_id, key) DO NOTHING;

INSERT INTO role (id, tenant_id, application_id, name, description, is_system, is_default, is_composite)
VALUES (
    '44444444-4444-4444-4444-444444444404',
    '11111111-1111-1111-1111-111111111101',
    '22222222-2222-2222-2222-222222222201',
    'Security Auditor',
    'Read-only access to audit and identity data',
    true,
    false,
    false
)
ON CONFLICT DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.application_id = '22222222-2222-2222-2222-222222222201'
  AND p.application_id = '22222222-2222-2222-2222-222222222201'
  AND (
    (r.name = 'Tenant Admin' AND p.key IN (
        'user:read', 'user:write', 'user:delete', 'role:read', 'role:write',
        'app:read', 'app:write', 'settings:write', 'audit:read', 'session:read'))
    OR (r.name = 'Member' AND p.key = 'user:read')
    OR (r.name = 'Security Auditor' AND p.key IN ('audit:read', 'user:read', 'role:read', 'session:read'))
  )
ON CONFLICT DO NOTHING;
