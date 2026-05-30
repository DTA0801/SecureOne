"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { FieldRow, Input, Select, Textarea } from "@/components/ui/Field";
import {
  applicationCreateAction,
  applicationUpdateAction,
  type FormState,
} from "@/lib/actions";
import { CheckboxGroup, FormActions, FormError, useCloseOnSuccess } from "./form-utils";
import type { Application, Tenant } from "@/lib/types";

const initial: FormState = { ok: false };

const GRANT_OPTIONS = [
  { value: "authorization_code", label: "authorization_code" },
  { value: "refresh_token", label: "refresh_token" },
  { value: "client_credentials", label: "client_credentials" },
  { value: "urn:ietf:params:oauth:grant-type:token-exchange", label: "token-exchange" },
];

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
      title={editing ? "Edit application" : "Register application"}
      description={editing ? "Update this OAuth client." : "Register a new OAuth 2.1 / OIDC client."}
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
  useCloseOnSuccess(state, close);

  return (
    <form action={formAction} className="space-y-4">
      {app && <input type="hidden" name="id" value={app.id} />}
      <FormError state={state} />
      <div className="grid grid-cols-2 gap-4">
        <FieldRow label="Name">
          <Input name="name" defaultValue={app?.name} placeholder="Acme Web Portal" required />
        </FieldRow>
        <FieldRow label="Tenant">
          <Select name="tenantId" defaultValue={app?.tenantId} disabled={Boolean(app)} required>
            {!app && <option value="">Select tenant…</option>}
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
        </FieldRow>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FieldRow label="Type">
          <Select name="type" defaultValue={app?.type ?? "web"}>
            <option value="web">Web app (confidential)</option>
            <option value="spa">SPA (public)</option>
            <option value="native">Native (public)</option>
            <option value="m2m">Machine-to-machine</option>
          </Select>
        </FieldRow>
        <FieldRow label="Status">
          <Select name="status" defaultValue={app?.status ?? "active"}>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </Select>
        </FieldRow>
      </div>
      {!app && (
        <FieldRow label="Client ID" hint="optional — auto-generated">
          <Input name="clientId" placeholder="acme-web" />
        </FieldRow>
      )}
      <FieldRow label="Grant types">
        <CheckboxGroup name="grantTypes" options={GRANT_OPTIONS} selected={app?.grantTypes ?? ["authorization_code", "refresh_token"]} />
      </FieldRow>
      <FieldRow label="Scopes" hint="comma-separated">
        <Input name="scopes" defaultValue={app?.scopes.join(", ")} placeholder="openid, profile, email" />
      </FieldRow>
      <FieldRow label="Redirect URIs" hint="one per line">
        <Textarea name="redirectUris" defaultValue={app?.redirectUris.join("\n")} placeholder="https://app.example.com/callback" />
      </FieldRow>
      <FormActions pending={pending} close={close} submitLabel={app ? "Save changes" : "Register client"} />
    </form>
  );
}
