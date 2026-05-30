import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  PermissionsWorkspace,
  PermissionsWorkspaceHeaderActions,
} from "@/components/permissions/PermissionsWorkspace";
import { resolveApplicationMeta } from "@/lib/api/app-workspace";
import { listPermissions, probePermissionsApi } from "@/lib/api/permissions";

export const dynamic = "force-dynamic";

export default async function AppPermissionsPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  const appMeta = await resolveApplicationMeta(applicationId);
  if (!appMeta) notFound();

  let permissions: Awaited<ReturnType<typeof listPermissions>> = [];
  let loadError: string | null = null;
  let apiAvailable = false;
  try {
    apiAvailable = await probePermissionsApi(applicationId);
    permissions = await listPermissions(applicationId);
  } catch (e) {
    permissions = [];
    const msg = e instanceof Error ? e.message : "Could not load permissions";
    if (msg.includes("HTTP 404") || msg.includes("Not Found")) {
      loadError =
        "Permission API returned 404 — auth-server is running an old build. Stop it and restart with the latest code (see below).";
    } else {
      loadError = msg;
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        breadcrumb={
          <Link href={`/app/${applicationId}/permissions`} className="hover:underline">
            Permissions
          </Link>
        }
        title="Permission catalog"
        description={`${appMeta.name} · manage the permission table used by RBAC`}
        actions={
          <PermissionsWorkspaceHeaderActions
            applicationId={applicationId}
            permissions={permissions}
          />
        }
      />
      {loadError && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          <p>{loadError}</p>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-ui bg-ui-elevated p-3 text-xs text-muted">
{`# PowerShell — stop process on port 9000, then start fresh:
Get-NetTCPConnection -LocalPort 9000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
cd apps/auth-server
.\\gradlew.bat bootRun`}
          </pre>
        </div>
      )}
      {!loadError && !apiAvailable && permissions.length === 0 && (
        <p className="mb-4 text-sm text-muted">No permissions loaded yet.</p>
      )}
      <PermissionsWorkspace
        permissions={permissions}
        applicationId={applicationId}
        appName={appMeta.name}
      />
    </div>
  );
}
