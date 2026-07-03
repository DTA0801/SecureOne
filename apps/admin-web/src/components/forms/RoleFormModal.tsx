"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { getRole } from "@/lib/api/roles";
import { PermissionMatrix } from "@/components/roles/PermissionMatrix";
import { RoleLabelBadge } from "@/components/roles/RoleLabelBadge";
import { Modal } from "@/components/ui/Modal";
import { FieldRow, Input, Select, Textarea } from "@/components/ui/Field";
import { FormSection, FormFieldGrid } from "@/components/forms/FormSection";
import { roleCreateAction, roleUpdateAction, type FormState } from "@/lib/actions";
import { FormActions, FormError, useCloseOnSuccess } from "./form-utils";
import { canRenameRole } from "@/lib/role-management";
import type { ApplicationProduct, Permission, Role, RoleDetail, Tenant } from "@/lib/types";

const initial: FormState = { ok: false };

export function RoleFormModal({
  role,
  roles,
  permissions,
  tenants,
  applications,
  tenantId,
  applicationId,
  lockToApplication = false,
  onCreated,
  onUpdated,
  triggerLabel,
  triggerVariant = "primary",
  triggerSize = "md",
}: {
  role?: Role | RoleDetail;
  roles: Role[];
  permissions: Permission[];
  tenants: Tenant[];
  applications: ApplicationProduct[];
  tenantId: string;
  applicationId: string;
  lockToApplication?: boolean;
  onCreated?: (roleId: string) => void;
  onUpdated?: () => void;
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
      width="xl"
      title={editing ? "Edit role" : "New role"}
      description={
        editing
          ? "Update name, description, direct permissions, and composite inheritance."
          : "Create a custom role for this application and assign permissions from the catalog."
      }
    >
      {(close) => (
        <RoleForm
          role={role}
          roles={roles}
          permissions={permissions}
          tenants={tenants}
          applications={applications}
          tenantId={tenantId}
          applicationId={applicationId}
          lockToApplication={lockToApplication}
          onCreated={onCreated}
          onUpdated={onUpdated}
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
  tenants,
  applications,
  tenantId,
  applicationId,
  lockToApplication,
  onCreated,
  onUpdated,
  close,
}: {
  role?: Role | RoleDetail;
  roles: Role[];
  permissions: Permission[];
  tenants: Tenant[];
  applications: ApplicationProduct[];
  tenantId: string;
  applicationId: string;
  lockToApplication: boolean;
  onCreated?: (roleId: string) => void;
  onUpdated?: () => void;
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
    () => role?.applicationId ?? tenantApps[0]?.id ?? applicationId,
  );
  const effectiveAppId = lockToApplication ? applicationId : selectedAppId || applicationId;
  const effectiveTenantId = lockToApplication ? tenantId : selectedTenantId;
  const canSubmit = Boolean(effectiveAppId && effectiveTenantId);
  const [isComposite, setIsComposite] = useState(role?.isComposite ?? false);
  const [permissionIds, setPermissionIds] = useState(() => new Set(role?.permissionIds ?? []));
  const [childRoleIds, setChildRoleIds] = useState(() => new Set(role?.childRoleIds ?? []));
  const inheritableRoles = roles.filter(
    (r) =>
      r.id !== role?.id &&
      !r.isComposite &&
      (r.applicationId === effectiveAppId || r.applicationId === applicationId),
  );

  useCloseOnSuccess(state, close, (s) => {
    if (s.createdRoleId) {
      onCreated?.(s.createdRoleId);
      try {
        sessionStorage.setItem("roles:lastCreated", s.createdRoleId);
      } catch {
        /* ignore */
      }
      return;
    }
    if (role) {
      onUpdated?.();
    }
  });

  useEffect(() => {
    if (!role?.id) return;
    getRole(role.id, applicationId, role).then((d) => {
      setPermissionIds(new Set(d.permissionIds));
      setChildRoleIds(new Set(d.childRoleIds));
      setIsComposite(d.isComposite);
    });
  }, [role?.id, applicationId, role]);

  return (
    <form action={formAction} className="space-y-5 pb-2">
      {role && <input type="hidden" name="id" value={role.id} />}
      <input type="hidden" name="applicationId" value={effectiveAppId} />
      {!role && <input type="hidden" name="tenantId" value={effectiveTenantId} />}
      {role && <input type="hidden" name="tenantId" value={role.tenantId} />}

      <FormError state={state} />

      {!role && lockToApplication && (
        <p className="rounded-lg border border-brand/20 bg-brand-muted/30 px-3 py-2.5 text-xs text-muted">
          Creating role for <strong className="text-ui">{applications[0]?.name ?? "this app"}</strong>
        </p>
      )}

      {role && !canRenameRole(role) && (
        <p className="rounded-lg border border-ui bg-ui-elevated/50 px-3 py-2.5 text-xs text-muted">
          This role&apos;s <strong className="text-ui">name is locked</strong> (built-in / system). You can still
          update description, permissions, and composite inheritance.
        </p>
      )}

      <FormSection title="Details" description="Name and description stored on the role row.">
        {!role && !lockToApplication && (
          <FormFieldGrid>
            <FieldRow label="Tenant">
              <Select
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
                value={effectiveAppId}
                required
                onChange={(e) => setSelectedAppId(e.target.value)}
              >
                {tenantApps.length === 0 ? (
                  <option value="">No applications</option>
                ) : (
                  tenantApps.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))
                )}
              </Select>
            </FieldRow>
          </FormFieldGrid>
        )}
        <FieldRow label="Name" hint={role && !canRenameRole(role) ? "Locked for built-in / system roles" : "Unique per application"}>
          <Input
            name="name"
            defaultValue={role?.name}
            placeholder="e.g. Support Agent"
            required
            disabled={(role && !canRenameRole(role)) || pending}
          />
        </FieldRow>
        <FieldRow label="Description">
          <Textarea
            name="description"
            defaultValue={role?.description}
            placeholder="What members with this role can do"
            rows={3}
            disabled={pending}
          />
        </FieldRow>
      </FormSection>

      <FormSection
        title="Composite role"
        description="Inherit all permissions from child roles (no nested composites)."
      >
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-ui bg-ui-elevated/30 px-3 py-3">
          <input
            type="checkbox"
            name="isComposite"
            value="on"
            checked={isComposite}
            onChange={(e) => setIsComposite(e.target.checked)}
            disabled={pending}
            className="mt-0.5 h-4 w-4 accent-[var(--ui-primary,#4f46e5)]"
          />
          <span className="text-sm">
            <span className="font-medium text-ui">Enable composite inheritance</span>
            <span className="mt-0.5 block text-xs text-muted">
              Parent role receives effective permissions from selected child roles.
            </span>
          </span>
        </label>

        {isComposite && (
          <div className="space-y-2">
            {inheritableRoles.length === 0 ? (
              <p className="text-xs text-muted">No non-composite roles available to inherit.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {inheritableRoles.map((r) => (
                  <li key={r.id}>
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-ui px-3 py-2.5 text-sm hover:bg-ui-elevated">
                      <input
                        type="checkbox"
                        checked={childRoleIds.has(r.id)}
                        onChange={() => {
                          const next = new Set(childRoleIds);
                          if (next.has(r.id)) next.delete(r.id);
                          else next.add(r.id);
                          setChildRoleIds(next);
                        }}
                        disabled={pending}
                        className="h-4 w-4 accent-[var(--ui-primary,#4f46e5)]"
                      />
                      <span className="min-w-0 flex-1 truncate font-medium text-ui">{r.name}</span>
                      <RoleLabelBadge label={r.label} />
                    </label>
                  </li>
                ))}
              </ul>
            )}
            {[...childRoleIds].map((id) => (
              <input key={id} type="hidden" name="childRoleIds" value={id} />
            ))}
          </div>
        )}
      </FormSection>

      <FormSection
        title="Direct permissions"
        description={
          permissions.length === 0
            ? "No permissions in catalog — install defaults on the Permissions page first."
            : "Checked keys are written to role_permission."
        }
      >
        {permissions.length === 0 ? (
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Seed default permissions before assigning to this role.
          </p>
        ) : (
          <PermissionMatrix
            permissions={permissions}
            selectedIds={permissionIds}
            onChange={setPermissionIds}
            compact
          />
        )}
        {[...permissionIds].map((id) => (
          <input key={id} type="hidden" name="permissionIds" value={id} />
        ))}
      </FormSection>

      {!canSubmit && !role && (
        <p className="text-sm text-amber-700 dark:text-amber-300">Select a valid application before saving.</p>
      )}

      <FormActions
        pending={pending}
        close={close}
        submitLabel={role ? "Save changes" : "Create role"}
        submitDisabled={
          !canSubmit ||
          (!role && permissions.length === 0 && !isComposite)
        }
        sticky
      />
    </form>
  );
}
