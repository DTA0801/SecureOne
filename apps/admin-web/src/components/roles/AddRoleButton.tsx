"use client";

import type { ReactNode } from "react";
import { RoleFormModal } from "@/components/forms/RoleFormModal";
import type { Application, Permission, Role, Tenant } from "@/lib/types";

/** Opens the create-role dialog scoped to the current application. */
export function AddRoleButton({
  roles,
  permissions,
  tenants,
  applications,
  tenantId,
  applicationId,
  onCreated,
  triggerLabel = "+ New role",
  triggerVariant = "primary",
  triggerSize = "md",
}: {
  roles: Role[];
  permissions: Permission[];
  tenants: Tenant[];
  applications: Application[];
  tenantId: string;
  applicationId: string;
  onCreated?: (roleId: string) => void;
  triggerLabel?: ReactNode;
  triggerVariant?: "primary" | "secondary" | "ghost" | "danger";
  triggerSize?: "sm" | "md";
}) {
  return (
    <RoleFormModal
      roles={roles}
      permissions={permissions}
      tenants={tenants}
      applications={applications}
      tenantId={tenantId}
      applicationId={applicationId}
      lockToApplication
      onCreated={onCreated}
      triggerLabel={triggerLabel}
      triggerVariant={triggerVariant}
      triggerSize={triggerSize}
    />
  );
}
