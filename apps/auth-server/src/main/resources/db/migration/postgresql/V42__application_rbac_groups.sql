-- Application-scoped RBAC groups: bundle roles and assign users to groups.

CREATE TABLE rbac_group (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES application(id) ON DELETE CASCADE,
    name           VARCHAR(150) NOT NULL,
    description    VARCHAR(500),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (application_id, name)
);
CREATE INDEX idx_rbac_group_application ON rbac_group(application_id);

CREATE TABLE rbac_group_role (
    group_id UUID NOT NULL REFERENCES rbac_group(id) ON DELETE CASCADE,
    role_id  UUID NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, role_id)
);
CREATE INDEX idx_rbac_group_role_role ON rbac_group_role(role_id);

CREATE TABLE rbac_group_member (
    group_id UUID NOT NULL REFERENCES rbac_group(id) ON DELETE CASCADE,
    user_id  UUID NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (group_id, user_id)
);
CREATE INDEX idx_rbac_group_member_user ON rbac_group_member(user_id);
