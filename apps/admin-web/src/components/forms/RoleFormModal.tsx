"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { FieldRow, Input, Textarea } from "@/components/ui/Field";
import { roleCreateAction, roleUpdateAction, type FormState } from "@/lib/actions";
import { CheckboxGroup, FormActions, FormError, useCloseOnSuccess } from "./form-utils";
import type { Permission, Role } from "@/lib/types";

const initial: FormState = { ok: false };

export function RoleFormModal({
  role,
  roles,
  permissions,
  tenantId,
  triggerLabel,
  triggerVariant = "primary",
  triggerSize = "md",
}: {
  role?: Role;
  roles: Role[];
  permissions: Permission[];
  tenantId: string;
  triggerLabel: React.ReactNode;
  triggerVariant?: "primary" | "secondary" | "ghost" | "danger";
  triggerSize?: "sm" | "md";
}) {
  const editing = Boolean(role);
  return (
    <Modal
      triggerLabel={triggerLabel}
      triggerVariant={triggerVariant}
      triggerSize={triggerSize}
      width="lg"
      title={editing ? "Edit role" : "New role"}
      description={editing ? "Update permissions or inherited roles." : "Create a role from permissions, or a composite of other roles."}
    >
      {(close) => (
        <RoleForm
          role={role}
          roles={roles}
          permissions={permissions}
          tenantId={tenantId}
          close={close}
        />
      )}
    </Modal>
  );
}

function RoleForm({
  role,
  roles,
  permissions,
  tenantId,
  close,
}: {
  role?: Role;
  roles: Role[];
  permissions: Permission[];
  tenantId: string;
  close: () => void;
}) {
  const action = role ? roleUpdateAction : roleCreateAction;
  const [state, formAction, pending] = useActionState(action, initial);
  const [composite, setComposite] = useState(role?.isComposite ?? false);
  useCloseOnSuccess(state, close);

  const permOptions = permissions.map((p) => ({ value: p.id, label: p.key, hint: p.description }));
  const roleOptions = roles
    .filter((r) => r.id !== role?.id)
    .map((r) => ({ value: r.id, label: r.name, hint: r.description }));

  return (
    <form action={formAction} className="space-y-4">
      {role && <input type="hidden" name="id" value={role.id} />}
      <input type="hidden" name="tenantId" value={role?.tenantId ?? tenantId} />
      <FormError state={state} />
      <FieldRow label="Name">
        <Input name="name" defaultValue={role?.name} placeholder="Tenant Admin" required />
      </FieldRow>
      <FieldRow label="Description">
        <Textarea name="description" defaultValue={role?.description} placeholder="What this role can do" />
      </FieldRow>
      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-black/10 px-3 py-2.5 text-sm dark:border-white/10">
        <input
          type="checkbox"
          name="isComposite"
          checked={composite}
          onChange={(e) => setComposite(e.target.checked)}
          className="h-4 w-4 accent-indigo-600"
        />
        <span>
          <span className="font-medium">Composite role</span>
          <span className="ml-2 text-black/40 dark:text-white/40">inherits other roles instead of direct permissions</span>
        </span>
      </label>

      {composite ? (
        <FieldRow label="Inherited roles">
          <CheckboxGroup name="childRoleIds" options={roleOptions} selected={role?.childRoleIds ?? []} />
        </FieldRow>
      ) : (
        <FieldRow label="Permissions">
          <CheckboxGroup name="permissionIds" options={permOptions} selected={role?.permissionIds ?? []} />
        </FieldRow>
      )}
      <FormActions pending={pending} close={close} submitLabel={role ? "Save changes" : "Create role"} />
    </form>
  );
}
