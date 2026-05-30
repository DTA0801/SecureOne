-- Seed default permission catalog for every application (idempotent).

INSERT INTO permission (id, application_id, key, description)
SELECT gen_random_uuid(), a.id, d.key, d.description
FROM application a
CROSS JOIN (
    VALUES
        ('user:read', 'View users and profiles'),
        ('user:write', 'Create and edit users'),
        ('user:delete', 'Delete users'),
        ('role:read', 'View roles and permissions'),
        ('role:write', 'Manage roles and assignments'),
        ('app:read', 'View applications'),
        ('app:write', 'Manage OAuth clients'),
        ('audit:read', 'View audit logs'),
        ('settings:write', 'Change application settings'),
        ('session:read', 'View active sessions')
) AS d(key, description)
WHERE NOT EXISTS (
    SELECT 1 FROM permission p
    WHERE p.application_id = a.id AND p.key = d.key
);
