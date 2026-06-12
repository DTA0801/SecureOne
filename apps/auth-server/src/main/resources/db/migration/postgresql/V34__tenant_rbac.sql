-- Tenant-scoped RBAC (platform / operator governance — separate from per-application product RBAC).

CREATE TABLE tenant_permission (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    key         VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    UNIQUE (tenant_id, key)
);
CREATE INDEX idx_tenant_permission_tenant ON tenant_permission(tenant_id);

CREATE TABLE tenant_role (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    name        VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    is_system   BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (tenant_id, name)
);
CREATE INDEX idx_tenant_role_tenant ON tenant_role(tenant_id);

CREATE TABLE tenant_role_permission (
    role_id       UUID NOT NULL REFERENCES tenant_role(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES tenant_permission(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE tenant_role_application (
    role_id        UUID NOT NULL REFERENCES tenant_role(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES application(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, application_id)
);

CREATE TABLE user_tenant_role (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    role_id    UUID NOT NULL REFERENCES tenant_role(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role_id)
);
CREATE INDEX idx_user_tenant_role_user ON user_tenant_role(user_id);
CREATE INDEX idx_user_tenant_role_role ON user_tenant_role(role_id);
