"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { FieldRow, Input, Select } from "@/components/ui/Field";
import { userCreateAction, userUpdateAction, type FormState } from "@/lib/actions";
import { CheckboxGroup, FormActions, FormError, useCloseOnSuccess } from "./form-utils";
import type { Role, Tenant, User } from "@/lib/types";

const initial: FormState = { ok: false };

export function UserFormModal({
  user,
  tenants,
  roles,
  triggerLabel,
  triggerVariant = "primary",
  triggerSize = "md",
}: {
  user?: User;
  tenants: Tenant[];
  roles: Role[];
  triggerLabel: React.ReactNode;
  triggerVariant?: "primary" | "secondary" | "ghost" | "danger";
  triggerSize?: "sm" | "md";
}) {
  const editing = Boolean(user);
  return (
    <Modal
      triggerLabel={triggerLabel}
      triggerVariant={triggerVariant}
      triggerSize={triggerSize}
      width="lg"
      title={editing ? "Edit user" : "Invite user"}
      description={editing ? "Update account details and roles." : "Create or invite a new user account."}
    >
      {(close) => <UserForm user={user} tenants={tenants} roles={roles} close={close} />}
    </Modal>
  );
}

function UserForm({
  user,
  tenants,
  roles,
  close,
}: {
  user?: User;
  tenants: Tenant[];
  roles: Role[];
  close: () => void;
}) {
  const action = user ? userUpdateAction : userCreateAction;
  const [state, formAction, pending] = useActionState(action, initial);
  useCloseOnSuccess(state, close);

  const roleOptions = roles.map((r) => ({ value: r.id, label: r.name, hint: r.description }));

  return (
    <form action={formAction} className="space-y-4">
      {user && <input type="hidden" name="id" value={user.id} />}
      <FormError state={state} />
      <div className="grid grid-cols-2 gap-4">
        <FieldRow label="First name">
          <Input name="firstName" defaultValue={user?.firstName} placeholder="Sarah" />
        </FieldRow>
        <FieldRow label="Last name">
          <Input name="lastName" defaultValue={user?.lastName} placeholder="Chen" />
        </FieldRow>
      </div>
      <FieldRow label="Email">
        <Input name="email" type="email" defaultValue={user?.email} placeholder="sarah.chen@acme.com" required />
      </FieldRow>
      <div className="grid grid-cols-2 gap-4">
        <FieldRow label="Username" hint="optional">
          <Input name="username" defaultValue={user?.username} placeholder="schen" />
        </FieldRow>
        <FieldRow label="Tenant">
          <Select name="tenantId" defaultValue={user?.tenantId} disabled={Boolean(user)} required>
            {!user && <option value="">Select tenant…</option>}
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
        </FieldRow>
      </div>
      <FieldRow label="Status">
        <Select name="status" defaultValue={user?.status ?? "invited"}>
          <option value="invited">Invited</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="disabled">Disabled</option>
        </Select>
      </FieldRow>
      <FieldRow label="Roles">
        <CheckboxGroup name="roleIds" options={roleOptions} selected={user?.roleIds ?? []} />
      </FieldRow>
      <FormActions pending={pending} close={close} submitLabel={user ? "Save changes" : "Invite user"} />
    </form>
  );
}
