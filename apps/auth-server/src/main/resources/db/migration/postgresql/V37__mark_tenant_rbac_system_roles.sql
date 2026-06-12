-- Catalog tenant RBAC roles are templates (not shown as custom roles in the governance UI).

UPDATE tenant_role
SET is_system = true
WHERE name IN ('Tenant Administrator', 'Application Operator', 'Tenant Auditor')
  AND is_system = false;
