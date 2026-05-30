-- Dev seed data for admin console smoke tests (idempotent).

INSERT INTO tenant (id, slug, name, status, settings, created_at, updated_at)
VALUES
    ('11111111-1111-1111-1111-111111111101', 'acme', 'Acme Corp', 'ACTIVE',
     '{"plan":"enterprise"}'::jsonb, now(), now()),
    ('11111111-1111-1111-1111-111111111102', 'globex', 'Globex', 'ACTIVE',
     '{"plan":"team"}'::jsonb, now(), now())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO application (id, tenant_id, name, slug, status, created_at, updated_at)
VALUES
    ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101',
     'Acme Web Portal', 'acme-web', 'ACTIVE', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO user_account (id, tenant_id, email, email_verified, username, display_name, status, type, created_at, updated_at)
VALUES
    ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111101',
     'sarah.chen@acme.com', true, 'schen', 'Sarah Chen', 'ACTIVE', 'USER', now(), now()),
    ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111102',
     'yuki.tanaka@globex.com', true, 'ytanaka', 'Yuki Tanaka', 'ACTIVE', 'USER', now(), now())
ON CONFLICT (tenant_id, email) DO NOTHING;
