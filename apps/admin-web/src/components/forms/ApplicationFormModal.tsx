"use client";

import { useActionState, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CopyValue } from "@/components/ui/CopyValue";
import { FieldRow, Input, Select, Textarea } from "@/components/ui/Field";
import {
  applicationCreateAction,
  applicationUpdateAction,
  type FormState,
} from "@/lib/actions";
import { CheckboxGroup, FormActions, FormError, useCloseOnSuccess } from "./form-utils";
import type { Application, AppType, Tenant } from "@/lib/types";

const initial: FormState = { ok: false };

const GRANT_OPTIONS = [
  { value: "authorization_code", label: "authorization_code" },
  { value: "refresh_token", label: "refresh_token" },
  { value: "client_credentials", label: "client_credentials" },
  { value: "urn:ietf:params:oauth:grant-type:device_code", label: "device_code" },
  { value: "urn:ietf:params:oauth:grant-type:token-exchange", label: "token-exchange" },
];

const TEMPLATE_BY_TYPE: Record<
  AppType,
  { grantTypes: string[]; scopes: string; pkceRequired: boolean; tokenEndpointAuthMethod: string }
> = {
  web: {
    grantTypes: ["authorization_code", "refresh_token"],
    scopes: "openid, profile, email",
    pkceRequired: true,
    tokenEndpointAuthMethod: "client_secret_basic",
  },
  spa: {
    grantTypes: ["authorization_code", "refresh_token"],
    scopes: "openid, profile, email",
    pkceRequired: true,
    tokenEndpointAuthMethod: "none",
  },
  native: {
    grantTypes: ["authorization_code", "refresh_token"],
    scopes: "openid, profile, email",
    pkceRequired: true,
    tokenEndpointAuthMethod: "none",
  },
  m2m: {
    grantTypes: ["client_credentials"],
    scopes: "",
    pkceRequired: false,
    tokenEndpointAuthMethod: "client_secret_basic",
  },
};

export function ApplicationFormModal({
  app,
  tenants,
  triggerLabel,
  triggerVariant = "primary",
  triggerSize = "md",
}: {
  app?: Application;
  tenants: Tenant[];
  triggerLabel: React.ReactNode;
  triggerVariant?: "primary" | "secondary" | "ghost" | "danger";
  triggerSize?: "sm" | "md";
}) {
  const editing = Boolean(app);
  return (
    <Modal
      triggerLabel={triggerLabel}
      triggerVariant={triggerVariant}
      triggerSize={triggerSize}
      width="lg"
      title={editing ? "Edit OAuth client" : "Register OAuth client"}
      description={
        editing
          ? "Update client metadata, grants, and redirect URIs."
          : "Enterprise OAuth 2.1 / OIDC client registration with secure defaults."
      }
    >
      {(close) => <ApplicationForm app={app} tenants={tenants} close={close} />}
    </Modal>
  );
}

function ApplicationForm({
  app,
  tenants,
  close,
}: {
  app?: Application;
  tenants: Tenant[];
  close: () => void;
}) {
  const action = app ? applicationUpdateAction : applicationCreateAction;
  const [state, formAction, pending] = useActionState(action, initial);
  const [clientType, setClientType] = useState<AppType>(app?.type ?? "web");
  const [grantTypes, setGrantTypes] = useState<string[]>(
    app?.grantTypes ?? TEMPLATE_BY_TYPE.web.grantTypes,
  );
  const [scopes, setScopes] = useState(app?.scopes.join(", ") ?? TEMPLATE_BY_TYPE.web.scopes);
  const [pkceRequired, setPkceRequired] = useState(app?.pkceRequired ?? true);
  const [authMethod, setAuthMethod] = useState(
    app?.tokenEndpointAuthMethod ?? TEMPLATE_BY_TYPE.web.tokenEndpointAuthMethod,
  );
  const [newSecret, setNewSecret] = useState<string | null>(null);

  useCloseOnSuccess(state, close, (s) => {
    if (s.createdClientSecret) {
      setNewSecret(s.createdClientSecret);
    } else {
      close();
    }
  });

  useEffect(() => {
    if (app) return;
    const t = TEMPLATE_BY_TYPE[clientType];
    setGrantTypes(t.grantTypes);
    setScopes(t.scopes);
    setPkceRequired(t.pkceRequired);
    setAuthMethod(t.tokenEndpointAuthMethod);
  }, [clientType, app]);

  if (newSecret) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-ui">Client registered. Copy the secret now — it will not be shown again.</p>
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
          <code className="block break-all font-mono text-sm">{newSecret}</code>
          <div className="mt-2">
            <CopyValue value={newSecret} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={close}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  const confidential = clientType === "web" || clientType === "m2m";

  return (
    <form action={formAction} className="space-y-4">
      {app && <input type="hidden" name="id" value={app.id} />}
      <input type="hidden" name="tokenEndpointAuthMethod" value={authMethod} />
      <FormError state={state} />
      <div className="grid grid-cols-2 gap-4">
        <FieldRow label="Display name">
          <Input name="name" defaultValue={app?.name} placeholder="Acme Web Portal" required />
        </FieldRow>
        <FieldRow label="Tenant">
          <Select name="tenantId" defaultValue={app?.tenantId} disabled={Boolean(app)} required>
            {!app && <option value="">Select tenant…</option>}
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </FieldRow>
      </div>
      <FieldRow label="Description" hint="Optional — shown in the client registry">
        <Textarea
          name="description"
          defaultValue={app?.description ?? ""}
          placeholder="Customer-facing web application for Acme Corp"
          rows={2}
        />
      </FieldRow>
      <div className="grid grid-cols-2 gap-4">
        <FieldRow label="Client template">
          <Select
            name="type"
            value={clientType}
            onChange={(e) => setClientType(e.target.value as AppType)}
          >
            <option value="web">Web app (confidential)</option>
            <option value="spa">SPA (public + PKCE)</option>
            <option value="native">Native (public + PKCE)</option>
            <option value="m2m">Machine-to-machine</option>
          </Select>
        </FieldRow>
        <FieldRow label="Status">
          <Select name="status" defaultValue={app?.status ?? "active"}>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
            <option value="suspended">Suspended</option>
          </Select>
        </FieldRow>
      </div>
      {!app && (
        <FieldRow label="Client ID" hint="Optional — auto-generated from name if blank">
          <Input name="clientId" placeholder="acme-web" />
        </FieldRow>
      )}
      <FieldRow label="Grant types">
        <CheckboxGroup
          key={grantTypes.join(",")}
          name="grantTypes"
          options={GRANT_OPTIONS}
          selected={grantTypes}
        />
      </FieldRow>
      <FieldRow label="Scopes" hint="Comma-separated OIDC scopes">
        <Input name="scopes" value={scopes} onChange={(e) => setScopes(e.target.value)} />
      </FieldRow>
      <FieldRow label="Redirect URIs" hint="One per line — required for authorization code flow">
        <Textarea
          name="redirectUris"
          defaultValue={app?.redirectUris.join("\n")}
          placeholder="https://app.example.com/callback"
        />
      </FieldRow>
      <FieldRow label="Post-logout redirect URIs" hint="Optional OIDC end-session redirects">
        <Textarea
          name="postLogoutRedirectUris"
          defaultValue={app?.postLogoutRedirectUris.join("\n")}
          placeholder="https://app.example.com/signed-out"
        />
      </FieldRow>
      <div className="flex flex-wrap items-center gap-6 rounded-lg border border-ui bg-ui-elevated/50 px-4 py-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="pkceRequired"
            checked={pkceRequired}
            onChange={(e) => setPkceRequired(e.target.checked)}
            className="rounded border-ui"
          />
          Require PKCE (recommended)
        </label>
        <span className="text-xs text-muted">
          Auth at token endpoint:{" "}
          <strong>{confidential ? authMethod : "none (public client)"}</strong>
        </span>
      </div>
      <FormActions pending={pending} close={close} submitLabel={app ? "Save changes" : "Register client"} />
    </form>
  );
}
