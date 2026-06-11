-- Per-app console access is redundant when the user already has tenant super admin.
DELETE FROM admin_console_access scoped
USING admin_console_access super
WHERE scoped.user_id = super.user_id
  AND scoped.tenant_id = super.tenant_id
  AND super.role_type = 'TENANT_SUPER_ADMIN'
  AND super.application_id IS NULL
  AND scoped.application_id IS NOT NULL
  AND scoped.role_type IN ('TENANT_ADMIN', 'APPLICATION_ADMIN');
