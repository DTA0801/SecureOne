-- Backfill standard RBAC roles for applications created without default role seeds.

INSERT INTO role (id, tenant_id, application_id, name, description, is_system, is_default, is_composite)
SELECT gen_random_uuid(), a.tenant_id, a.id, 'Tenant Admin', 'Full tenant administration', true, false, false
FROM application a
WHERE NOT EXISTS (
    SELECT 1 FROM role r WHERE r.application_id = a.id AND r.name = 'Tenant Admin'
);

INSERT INTO role (id, tenant_id, application_id, name, description, is_system, is_default, is_composite)
SELECT gen_random_uuid(), a.tenant_id, a.id, 'Member', 'Standard end-user access', true, true, false
FROM application a
WHERE NOT EXISTS (
    SELECT 1 FROM role r WHERE r.application_id = a.id AND r.name = 'Member'
);

INSERT INTO role (id, tenant_id, application_id, name, description, is_system, is_default, is_composite)
SELECT gen_random_uuid(), a.tenant_id, a.id, 'Application Admin',
       'Manage users and roles for this application in SecureOne Admin', true, false, false
FROM application a
WHERE NOT EXISTS (
    SELECT 1 FROM role r WHERE r.application_id = a.id AND r.name = 'Application Admin'
);

INSERT INTO role (id, tenant_id, application_id, name, description, is_system, is_default, is_composite)
SELECT gen_random_uuid(), a.tenant_id, a.id, 'Security Auditor', 'Read-only access to audit and identity data', true, false, false
FROM application a
WHERE NOT EXISTS (
    SELECT 1 FROM role r WHERE r.application_id = a.id AND r.name = 'Security Auditor'
);

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
JOIN permission p ON p.application_id = r.application_id
WHERE (
    (r.name = 'Tenant Admin' AND p.key IN (
        'user:read', 'user:write', 'user:delete', 'role:read', 'role:write',
        'app:read', 'app:write', 'settings:write', 'audit:read', 'session:read'))
    OR (r.name = 'Member' AND p.key = 'user:read')
    OR (r.name = 'Application Admin' AND p.key IN (
        'user:read', 'user:write', 'role:read', 'app:read', 'audit:read', 'session:read'))
    OR (r.name = 'Security Auditor' AND p.key IN ('audit:read', 'user:read', 'role:read', 'session:read'))
)
AND NOT EXISTS (
    SELECT 1 FROM role_permission rp WHERE rp.role_id = r.id AND rp.permission_id = p.id
);
