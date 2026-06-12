-- Backfill tenant RBAC catalog for existing tenants (roles created on first API access if missing).

INSERT INTO tenant_permission (id, tenant_id, key, description)
SELECT gen_random_uuid(), t.id, e.key, e.description
FROM tenant t
CROSS JOIN (
    VALUES
        ('tenant:read', 'View tenant metadata and roster'),
        ('tenant:manage', 'Edit tenant settings and roster'),
        ('operator:read', 'View tenant operators and console access'),
        ('operator:manage', 'Grant or revoke operator console access'),
        ('application:access', 'Assign users to applications'),
        ('application:manage', 'Create and configure applications'),
        ('console:users', 'Admin console — Users section'),
        ('console:roles', 'Admin console — Roles section'),
        ('console:permissions', 'Admin console — Permissions section'),
        ('console:settings', 'Admin console — Settings section'),
        ('console:audit', 'Admin console — Audit log'),
        ('console:logs', 'Admin console — Application logs'),
        ('console:sessions', 'Admin console — Sessions')
) AS e(key, description)
WHERE NOT EXISTS (
    SELECT 1 FROM tenant_permission p WHERE p.tenant_id = t.id AND p.key = e.key
);

INSERT INTO tenant_role (id, tenant_id, name, description, is_system)
SELECT gen_random_uuid(), t.id, r.name, r.description, true
FROM tenant t
CROSS JOIN (
    VALUES
        ('Tenant Administrator', 'Full tenant governance — operators, applications, and console features'),
        ('Application Operator', 'Manage users and settings for assigned applications'),
        ('Tenant Auditor', 'Read-only access to tenant roster, audit, and logs')
) AS r(name, description)
WHERE NOT EXISTS (
    SELECT 1 FROM tenant_role tr WHERE tr.tenant_id = t.id AND tr.name = r.name
);

INSERT INTO tenant_role_permission (role_id, permission_id)
SELECT tr.id, tp.id
FROM tenant_role tr
JOIN tenant_permission tp ON tp.tenant_id = tr.tenant_id
WHERE (
    (tr.name = 'Tenant Administrator' AND tp.key IN (
        'tenant:read', 'tenant:manage', 'operator:read', 'operator:manage',
        'application:access', 'application:manage',
        'console:users', 'console:roles', 'console:permissions', 'console:settings',
        'console:audit', 'console:logs', 'console:sessions'))
    OR (tr.name = 'Application Operator' AND tp.key IN (
        'tenant:read', 'operator:read', 'application:access',
        'console:users', 'console:roles', 'console:settings', 'console:audit', 'console:sessions'))
    OR (tr.name = 'Tenant Auditor' AND tp.key IN (
        'tenant:read', 'operator:read', 'console:audit', 'console:logs', 'console:sessions'))
)
AND NOT EXISTS (
    SELECT 1 FROM tenant_role_permission rp
    WHERE rp.role_id = tr.id AND rp.permission_id = tp.id
);
