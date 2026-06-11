-- Admin console login roles (separate from end-user application RBAC).
-- APPLICATION_ADMIN: one assigned application
-- TENANT_ADMIN: explicitly assigned applications only
-- TENANT_SUPER_ADMIN: all applications in the tenant

CREATE TABLE admin_console_access (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    application_id  UUID REFERENCES application(id) ON DELETE CASCADE,
    role_type       VARCHAR(32) NOT NULL,
    granted_by      UUID REFERENCES user_account(id) ON DELETE SET NULL,
    granted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ,
    CONSTRAINT admin_console_access_role_type_chk CHECK (
        role_type IN ('APPLICATION_ADMIN', 'TENANT_ADMIN', 'TENANT_SUPER_ADMIN')
    ),
    CONSTRAINT admin_console_access_scope_chk CHECK (
        (role_type = 'TENANT_SUPER_ADMIN' AND application_id IS NULL)
        OR (role_type IN ('APPLICATION_ADMIN', 'TENANT_ADMIN') AND application_id IS NOT NULL)
    )
);

CREATE INDEX idx_admin_console_access_user ON admin_console_access(user_id);
CREATE INDEX idx_admin_console_access_tenant ON admin_console_access(tenant_id);
CREATE INDEX idx_admin_console_access_app ON admin_console_access(application_id);

CREATE UNIQUE INDEX uq_admin_console_access_app_scope
    ON admin_console_access(user_id, tenant_id, application_id, role_type)
    WHERE application_id IS NOT NULL;

CREATE UNIQUE INDEX uq_admin_console_access_tenant_super
    ON admin_console_access(user_id, tenant_id)
    WHERE role_type = 'TENANT_SUPER_ADMIN';

-- Application Admin system role (per application) for in-app RBAC permissions.
INSERT INTO role (id, tenant_id, application_id, name, description, is_system, is_default, is_composite)
SELECT gen_random_uuid(), a.tenant_id, a.id, 'Application Admin',
       'Manage users and roles for this application in SecureOne Admin', true, false, false
FROM application a
WHERE NOT EXISTS (
    SELECT 1 FROM role r
    WHERE r.application_id = a.id AND r.name = 'Application Admin'
);

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
JOIN permission p ON p.application_id = r.application_id
WHERE r.name = 'Application Admin'
  AND p.key IN ('user:read', 'user:write', 'role:read', 'app:read', 'audit:read', 'session:read')
ON CONFLICT DO NOTHING;

-- Backfill existing Tenant Admin RBAC grants as TENANT_ADMIN console access.
INSERT INTO admin_console_access (user_id, tenant_id, application_id, role_type, granted_at)
SELECT ur.user_id, r.tenant_id, r.application_id, 'TENANT_ADMIN', COALESCE(ur.granted_at, now())
FROM user_role ur
JOIN role r ON r.id = ur.role_id
WHERE ur.user_id IS NOT NULL
  AND r.name = 'Tenant Admin'
ON CONFLICT DO NOTHING;

-- Dev: Acme tenant super admin for sarah.chen@acme.com
INSERT INTO admin_console_access (user_id, tenant_id, application_id, role_type, granted_at)
SELECT u.id, t.id, NULL, 'TENANT_SUPER_ADMIN', now()
FROM user_account u
JOIN tenant t ON t.id = u.tenant_id
WHERE t.slug = 'acme' AND u.email = 'sarah.chen@acme.com'
ON CONFLICT DO NOTHING;
