"use client";

import { useActionState, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { FieldRow, Input, Select, Textarea } from "@/components/ui/Field";
import { roleCreateAction, roleUpdateAction, type FormState } from "@/lib/actions";
import { FormActions, FormError, useCloseOnSuccess } from "./form-utils";
import type { Application, Role, Tenant } from "@/lib/types";

const initial: FormState = { ok: false };

export function RoleFormModal({
  role,
  roles,
  tenants,
  applications,
  tenantId,
  applicationId,
  triggerLabel,
  triggerVariant = "primary",
  triggerSize = "md",
}: {
  role?: Role;
  roles: Role[];
  tenants: Tenant[];
  applications: Application[];
  tenantId: string;
  applicationId: string;
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
      width="md"
      title={editing ? "Edit role" : "New role"}
      description={
        editing
          ? "Update name and description. Permission assignment comes in a later release."
          : "Create a role scoped to a tenant application."
      }
    >
      {(close) => (
        <RoleForm
          role={role}
          roles={roles}
          tenants={tenants}
          applications={applications}
          tenantId={tenantId}
          applicationId={applicationId}
          close={close}
        />
      )}
    </Modal>
  );
}

function RoleForm({
  role,
  tenants,
  applications,
  tenantId,
  applicationId,
  close,
}: {
  role?: Role;
  roles: Role[];
  tenants: Tenant[];
  applications: Application[];
  tenantId: string;
  applicationId: string;
  close: () => void;
}) {
  const action = role ? roleUpdateAction : roleCreateAction;
  const [state, formAction, pending] = useActionState(action, initial);
  const [selectedTenantId, setSelectedTenantId] = useState(role?.tenantId ?? tenantId);
  const tenantApps = useMemo(
    () => applications.filter((a) => a.tenantId === selectedTenantId),
    [applications, selectedTenantId],
  );
  const [selectedAppId, setSelectedAppId] = useState(
    tenantApps[0]?.id ?? applicationId,
  );
  useCloseOnSuccess(state, close);

  return (
    <form action={formAction} className="space-y-4">
      {role && <input type="hidden" name="id" value={role.id} />}
      <FormError state={state} />
      {!role && (
        <>
          <FieldRow label="Tenant">
            <Select
              name="tenantId"
              value={selectedTenantId}
              onChange={(e) => {
                const tid = e.target.value;
                setSelectedTenantId(tid);
                const first = applications.find((a) => a.tenantId === tid);
                setSelectedAppId(first?.id ?? "");
              }}
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </FieldRow>
          <FieldRow label="Application">
            <Select
              name="applicationId"
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
            >
              {tenantApps.length === 0 ? (
                <option value="">No applications — register one first</option>
              ) : (
                tenantApps.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))
              )}
            </Select>
          </FieldRow>
        </>
      )}
      {role && <input type="hidden" name="tenantId" value={role.tenantId} />}
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
          defaultChecked={role?.isComposite}
          className="h-4 w-4 accent-[var(--ui-primary,#4f46e5)]"
        />
        <span>
          <span className="font-medium">Composite role</span>
          <span className="ml-2 text-faint">inherits other roles (future)</span>
        </span>
      </label>
      <FormActions pending={pending} close={close} submitLabel={role ? "Save changes" : "Create role"} />
    </form>
  );
}
