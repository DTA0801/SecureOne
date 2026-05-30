-- Platform settings, application OAuth config, and dev seed for audit/login history.

ALTER TABLE application
    ADD COLUMN IF NOT EXISTS config JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS platform_setting (
    key         VARCHAR(150) PRIMARY KEY,
    value       JSONB        NOT NULL DEFAULT '{}'::jsonb,
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Default notification + email settings (admin can change via API).
INSERT INTO platform_setting (key, value)
VALUES
    ('notifications', '{
      "emailEnabled": true,
      "userEmailEnabled": true,
      "pushEnabled": false,
      "auditAlertsEnabled": true,
      "securityAlertsEnabled": true,
      "adminRecipients": ["admin@acme.com"]
    }'::jsonb),
    ('email', '{
      "fromName": "SecureOne",
      "fromAddress": "noreply@secureone.local",
      "replyTo": "support@secureone.local"
    }'::jsonb)
ON CONFLICT (key) DO NOTHING;

UPDATE application
SET config = '{
  "type": "web",
  "clientId": "acme-web",
  "grantTypes": ["authorization_code", "refresh_token"],
  "scopes": ["openid", "profile", "email"],
  "redirectUris": ["https://app.acme.com/callback"]
}'::jsonb
WHERE id = '22222222-2222-2222-2222-222222222201';

INSERT INTO audit_log (id, tenant_id, actor_type, actor_id, action, target_type, target_id, ip, metadata, created_at)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111101', 'USER', '33333333-3333-3333-3333-333333333301',
     'user.login.success', 'user_account', '33333333-3333-3333-3333-333333333301', '203.0.113.10',
     '{"result":"success","actorEmail":"sarah.chen@acme.com","targetLabel":"sarah.chen@acme.com"}'::jsonb, now() - interval '2 hours'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '11111111-1111-1111-1111-111111111101', 'ADMIN', NULL,
     'tenant.updated', 'tenant', '11111111-1111-1111-1111-111111111101', '203.0.113.10',
     '{"result":"success","actorEmail":"admin","targetLabel":"Acme Corp"}'::jsonb, now() - interval '1 hour')
ON CONFLICT DO NOTHING;

INSERT INTO login_history (id, tenant_id, user_id, result, ip, device, geo, created_at)
VALUES
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '11111111-1111-1111-1111-111111111101', '33333333-3333-3333-3333-333333333301',
     'SUCCESS', '203.0.113.10', 'Chrome · macOS', '{"location":"San Francisco, US","method":"passkey"}'::jsonb, now() - interval '3 hours'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '11111111-1111-1111-1111-111111111102', '33333333-3333-3333-3333-333333333302',
     'SUCCESS', '198.51.100.5', 'Edge · Windows', '{"location":"Tokyo, JP","method":"passkey"}'::jsonb, now() - interval '5 hours')
ON CONFLICT DO NOTHING;
