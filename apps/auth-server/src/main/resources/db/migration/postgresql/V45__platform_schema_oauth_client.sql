-- Move shared tables from public → platform schema, add oauth_client + application schema registry.

CREATE SCHEMA IF NOT EXISTS platform;

-- Drop empty platform tables left from a partial migration so public copies can be moved.
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT p.tablename
        FROM pg_tables p
        INNER JOIN pg_tables pub ON pub.tablename = p.tablename AND pub.schemaname = 'public'
        WHERE p.schemaname = 'platform'
          AND p.tablename NOT IN ('flyway_schema_history')
    LOOP
        EXECUTE format('DROP TABLE IF EXISTS platform.%I CASCADE', tbl);
    END LOOP;
END $$;

DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename <> 'spatial_ref_sys'
          AND tablename <> 'flyway_schema_history'
    LOOP
        EXECUTE format('ALTER TABLE public.%I SET SCHEMA platform', tbl);
    END LOOP;
END $$;

ALTER TABLE platform.application
    ADD COLUMN IF NOT EXISTS schema_name VARCHAR(63);

CREATE UNIQUE INDEX IF NOT EXISTS uq_application_schema_name
    ON platform.application (schema_name)
    WHERE schema_name IS NOT NULL;

CREATE TABLE IF NOT EXISTS platform.application_schema (
    application_id UUID PRIMARY KEY REFERENCES platform.application (id) ON DELETE CASCADE,
    schema_name    VARCHAR(63) NOT NULL UNIQUE,
    status         VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    flyway_version VARCHAR(64),
    provisioned_at TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform.oauth_client (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id              UUID NOT NULL REFERENCES platform.application (id) ON DELETE CASCADE,
    client_id                   VARCHAR(150) NOT NULL UNIQUE,
    client_secret               VARCHAR(500),
    client_name                 VARCHAR(255) NOT NULL,
    type                        VARCHAR(32) NOT NULL DEFAULT 'web',
    redirect_uris               JSONB NOT NULL DEFAULT '[]'::jsonb,
    post_logout_redirect_uris   JSONB NOT NULL DEFAULT '[]'::jsonb,
    grant_types                 JSONB NOT NULL DEFAULT '[]'::jsonb,
    scopes                      JSONB NOT NULL DEFAULT '[]'::jsonb,
    token_endpoint_auth_method  VARCHAR(64) NOT NULL DEFAULT 'client_secret_basic',
    require_pkce                BOOLEAN NOT NULL DEFAULT true,
    status                      VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oauth_client_application ON platform.oauth_client (application_id);

-- Backfill OAuth clients from legacy application.config JSONB.
INSERT INTO platform.oauth_client (
    id,
    application_id,
    client_id,
    client_secret,
    client_name,
    type,
    redirect_uris,
    post_logout_redirect_uris,
    grant_types,
    scopes,
    token_endpoint_auth_method,
    require_pkce,
    status,
    created_at,
    updated_at)
SELECT
    gen_random_uuid(),
    a.id,
    COALESCE(NULLIF(TRIM(a.config ->> 'clientId'), ''), a.slug),
    NULLIF(a.config ->> 'clientSecret', ''),
    a.name,
    COALESCE(NULLIF(TRIM(a.config ->> 'type'), ''), 'web'),
    COALESCE(a.config -> 'redirectUris', '[]'::jsonb),
    COALESCE(a.config -> 'postLogoutRedirectUris', '[]'::jsonb),
    COALESCE(a.config -> 'grantTypes', '[]'::jsonb),
    COALESCE(a.config -> 'scopes', '[]'::jsonb),
    COALESCE(NULLIF(TRIM(a.config ->> 'tokenEndpointAuthMethod'), ''), 'client_secret_basic'),
    COALESCE((a.config ->> 'pkceRequired')::boolean, true),
    a.status,
    a.created_at,
    a.updated_at
FROM platform.application a
WHERE (
        a.config ? 'clientId'
        OR a.config ? 'type'
        OR a.config ? 'grantTypes'
        OR a.config ? 'redirectUris')
  AND NOT EXISTS (
        SELECT 1 FROM platform.oauth_client oc WHERE oc.application_id = a.id);

-- Strip OAuth protocol keys from application.config; retain non-OAuth keys (e.g. tokenPolicy).
UPDATE platform.application
SET config = config
    - 'type'
    - 'clientId'
    - 'clientSecret'
    - 'grantTypes'
    - 'scopes'
    - 'redirectUris'
    - 'postLogoutRedirectUris'
    - 'pkceRequired'
    - 'tokenEndpointAuthMethod'
WHERE config ?| ARRAY[
    'type', 'clientId', 'clientSecret', 'grantTypes', 'scopes',
    'redirectUris', 'postLogoutRedirectUris', 'pkceRequired', 'tokenEndpointAuthMethod'];
