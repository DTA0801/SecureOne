"use client";

import { UsersPanel } from "./ApplicationWorkspace";

export function AppUsersPanel({
  applicationId,
  tenantId,
  appName,
  tenantName,
}: {
  applicationId: string;
  tenantId: string;
  appName?: string;
  tenantName?: string;
}) {
  return (
    <UsersPanel
      applicationId={applicationId}
      tenantId={tenantId}
      appName={appName ?? "Application"}
      tenantName={tenantName ?? "Tenant"}
    />
  );
}
