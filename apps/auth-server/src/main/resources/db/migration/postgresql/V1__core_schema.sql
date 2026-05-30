-- SecureOne core schema (MVP) — PostgreSQL
-- Multi-tenant IAM: tenants, applications, users, RBAC (with composite roles), audit.
-- See docs/04-data-model.md. UUID v7 generated in the app; gen_random_uuid() used as a DB default fallback.

-- ----------------------------------------------------------------------------
-- Domain 1 — Tenancy & Applications
-- ----------------------------------------------------------------------------
CREATE TABLE tenant (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        VARCHAR(100) NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    status      VARCHAR(32)  NOT NULL DEFAULT 'ACTIVE',
    settings    JSONB        NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE application (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(100) NOT NULL,
    description VARCHAR(1000),
    status      VARCHAR(32)  NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, slug)
);
CREATE INDEX idx_application_tenant ON application(tenant_id);

-- ----------------------------------------------------------------------------
-- Domain 2 — Identity
-- ----------------------------------------------------------------------------
CREATE TABLE user_account (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    email              VARCHAR(320) NOT NULL,
    email_verified     BOOLEAN      NOT NULL DEFAULT false,
    username           VARCHAR(150),
    phone              VARCHAR(32),
    phone_verified     BOOLEAN      NOT NULL DEFAULT false,
    display_name       VARCHAR(255),
    status             VARCHAR(32)  NOT NULL DEFAULT 'PENDING',
    type               VARCHAR(32)  NOT NULL DEFAULT 'USER',
    failed_login_count INT          NOT NULL DEFAULT 0,
    locked_until       TIMESTAMPTZ,
    last_login_at      TIMESTAMPTZ,
    attributes         JSONB        NOT NULL DEFAULT '{}'::jsonb,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, email)
);
CREATE INDEX idx_user_tenant_status ON user_account(tenant_id, status);

CREATE TABLE user_credential (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    algorithm     VARCHAR(64)  NOT NULL DEFAULT 'argon2id',
    params        JSONB        NOT NULL DEFAULT '{}'::jsonb,
    is_current    BOOLEAN      NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_credential_user ON user_credential(user_id);

-- ----------------------------------------------------------------------------
-- Domain 3 — Authorization (RBAC + composite roles)
-- ----------------------------------------------------------------------------
CREATE TABLE permission (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES application(id) ON DELETE CASCADE,
    key            VARCHAR(150) NOT NULL,
    description    VARCHAR(500),
    UNIQUE (application_id, key)
);

CREATE TABLE role (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES application(id) ON DELETE CASCADE,
    name           VARCHAR(150) NOT NULL,
    description    VARCHAR(500),
    is_default     BOOLEAN NOT NULL DEFAULT false,
    is_system      BOOLEAN NOT NULL DEFAULT false,
    is_composite   BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (application_id, name)
);
CREATE INDEX idx_role_tenant ON role(tenant_id);

CREATE TABLE role_permission (
    role_id       UUID NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permission(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Composite / hierarchical roles (a parent role includes child roles).
CREATE TABLE role_composite (
    parent_role_id UUID NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    child_role_id  UUID NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    PRIMARY KEY (parent_role_id, child_role_id),
    CHECK (parent_role_id <> child_role_id)
);
CREATE INDEX idx_role_composite_child ON role_composite(child_role_id);

CREATE TABLE user_role (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID REFERENCES user_account(id) ON DELETE CASCADE,
    role_id            UUID NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    granted_by         UUID,
    granted_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at         TIMESTAMPTZ
);
CREATE INDEX idx_user_role_user ON user_role(user_id);
CREATE INDEX idx_user_role_role ON user_role(role_id);

-- ----------------------------------------------------------------------------
-- Domain 7 — Audit & history (append-only)
-- ----------------------------------------------------------------------------
CREATE TABLE audit_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID,
    actor_type  VARCHAR(32) NOT NULL,
    actor_id    UUID,
    action      VARCHAR(150) NOT NULL,
    target_type VARCHAR(100),
    target_id   UUID,
    ip          VARCHAR(64),
    user_agent  VARCHAR(512),
    metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_tenant_created ON audit_log(tenant_id, created_at);

CREATE TABLE login_history (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  UUID,
    user_id    UUID,
    result     VARCHAR(32) NOT NULL,
    ip         VARCHAR(64),
    device     VARCHAR(255),
    geo        JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_login_history_tenant_created ON login_history(tenant_id, created_at);
