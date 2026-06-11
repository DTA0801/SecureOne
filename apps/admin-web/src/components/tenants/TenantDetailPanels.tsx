"use client";

import { useCallback, useEffect, useState } from "react";
import { TenantWorkspacePanel } from "@/components/tenant/TenantWorkspacePanel";
import { AdminConsoleAccessPanel } from "@/components/tenants/AdminConsoleAccessPanel";
import type { ConsoleAccessAssignment } from "@/lib/api/admin-console-access";
import {
  fetchTenantWorkspace,
  normalizeTenantWorkspaceUser,
  type TenantWorkspace,
} from "@/lib/api/tenant-workspace";
import type { Application, Role, Tenant } from "@/lib/types";

function consoleAccessFrom(workspace: TenantWorkspace): ConsoleAccessAssignment[] {
  return workspace.consoleAccess ?? [];
}

export function TenantDetailPanels({
  initialWorkspace,
  tenant,
  roles,
  applications,
}: {
  initialWorkspace: TenantWorkspace;
  tenant: Tenant;
  roles: Role[];
  applications: Application[];
}) {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [assignments, setAssignments] = useState(() => consoleAccessFrom(initialWorkspace));

  const applyWorkspace = useCallback((next: TenantWorkspace) => {
    if (!Array.isArray(next.users) || !Array.isArray(next.applications)) return;
    const normalized = {
      ...next,
      users: next.users.map((u) => normalizeTenantWorkspaceUser(u)),
      consoleAccess: next.consoleAccess ?? [],
    };
    setWorkspace(normalized);
    setAssignments(consoleAccessFrom(normalized));
  }, []);

  // Server render may omit console access; always refetch once on mount.
  useEffect(() => {
    let cancelled = false;
    void fetchTenantWorkspace(tenant.id)
      .then((next) => {
        if (!cancelled) applyWorkspace(next);
      })
      .catch(() => {
        /* keep server-provided initial state */
      });
    return () => {
      cancelled = true;
    };
  }, [tenant.id, applyWorkspace]);

  const refreshAll = useCallback(async () => {
    const next = await fetchTenantWorkspace(tenant.id);
    applyWorkspace(next);
  }, [tenant.id, applyWorkspace]);

  return (
    <>
      <TenantWorkspacePanel
        workspace={workspace}
        tenant={tenant}
        roles={roles}
        manageTenantId={tenant.id}
        consoleAssignments={assignments}
        onMutated={refreshAll}
      />
      <AdminConsoleAccessPanel
        tenantId={tenant.id}
        applications={applications}
        assignments={assignments}
        onMutated={refreshAll}
      />
    </>
  );
}
