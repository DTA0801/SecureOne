"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { FieldRow, Input, Select } from "@/components/ui/Field";
import { tenantCreateAction, tenantUpdateAction, type FormState } from "@/lib/actions";
import { FormActions, FormError, useCloseOnSuccess } from "./form-utils";
import type { Tenant } from "@/lib/types";

const initial: FormState = { ok: false };

export function TenantFormModal({
  tenant,
  triggerLabel,
  triggerVariant = "primary",
  triggerSize = "md",
}: {
  tenant?: Tenant;
  triggerLabel: React.ReactNode;
  triggerVariant?: "primary" | "secondary" | "ghost" | "danger";
  triggerSize?: "sm" | "md";
}) {
  const editing = Boolean(tenant);
  return (
    <Modal
      triggerLabel={triggerLabel}
      triggerVariant={triggerVariant}
      triggerSize={triggerSize}
      title={editing ? "Edit tenant" : "New tenant"}
      description={editing ? "Update organization details." : "Create a new isolated organization."}
    >
      {(close) => <TenantForm tenant={tenant} close={close} />}
    </Modal>
  );
}

function TenantForm({ tenant, close }: { tenant?: Tenant; close: () => void }) {
  const action = tenant ? tenantUpdateAction : tenantCreateAction;
  const [state, formAction, pending] = useActionState(action, initial);
  useCloseOnSuccess(state, close);

  return (
    <form action={formAction} className="space-y-4">
      {tenant && <input type="hidden" name="id" value={tenant.id} />}
      <FormError state={state} />
      <FieldRow label="Name">
        <Input name="name" defaultValue={tenant?.name} placeholder="Acme Corp" required />
      </FieldRow>
      <FieldRow label="Slug" hint="optional — auto-generated">
        <Input name="slug" defaultValue={tenant?.slug} placeholder="acme" />
      </FieldRow>
      <div className="grid grid-cols-2 gap-4">
        <FieldRow label="Plan">
          <Select name="plan" defaultValue={tenant?.plan ?? "free"}>
            <option value="free">Free</option>
            <option value="team">Team</option>
            <option value="enterprise">Enterprise</option>
          </Select>
        </FieldRow>
        <FieldRow label="Status">
          <Select name="status" defaultValue={tenant?.status ?? "active"}>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </Select>
        </FieldRow>
      </div>
      <FormActions pending={pending} close={close} submitLabel={tenant ? "Save changes" : "Create tenant"} />
    </form>
  );
}
