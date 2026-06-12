-- Add Groups console section to tenant RBAC and operator role defaults.

INSERT INTO tenant_permission (id, tenant_id, key, description)
SELECT gen_random_uuid(), t.id, 'console:groups', 'Admin console — Groups section'
FROM tenant t
WHERE NOT EXISTS (
    SELECT 1 FROM tenant_permission p WHERE p.tenant_id = t.id AND p.key = 'console:groups'
);

INSERT INTO tenant_role_permission (role_id, permission_id)
SELECT tr.id, tp.id
FROM tenant_role tr
JOIN tenant_permission tp ON tp.tenant_id = tr.tenant_id AND tp.key = 'console:groups'
WHERE tr.name IN ('Tenant Administrator', 'Application Operator')
AND NOT EXISTS (
    SELECT 1 FROM tenant_role_permission rp
    WHERE rp.role_id = tr.id AND rp.permission_id = tp.id
);

-- Tenants with customized console operator defaults: grant groups where roles is already enabled.
INSERT INTO tenant_console_role_feature (tenant_id, role_key, feature_key)
SELECT DISTINCT tcrf.tenant_id, tcrf.role_key, 'groups'
FROM tenant_console_role_feature tcrf
WHERE tcrf.feature_key = 'roles'
AND tcrf.role_key IN ('APPLICATION_ADMIN', 'TENANT_ADMIN', 'TENANT_SUPER_ADMIN')
AND NOT EXISTS (
    SELECT 1 FROM tenant_console_role_feature existing
    WHERE existing.tenant_id = tcrf.tenant_id
      AND existing.role_key = tcrf.role_key
      AND existing.feature_key = 'groups'
);
