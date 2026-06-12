"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "./AppSidebar";
import { PlatformSidebar } from "./PlatformSidebar";
import { Topbar } from "./Topbar";
import { useLastApplicationId } from "@/hooks/useLastApplication";
import { applicationIdFromPath, isAppWorkspacePath } from "@/lib/app-routes";
import type { ApplicationContextItem } from "@/lib/api/context";

export function ConsoleShell({
  children,
  superAdmin,
  applications,
  tenantSuperAdmin = false,
}: {
  children: React.ReactNode;
  superAdmin: boolean;
  applications: ApplicationContextItem[];
  tenantSuperAdmin?: boolean;
}) {
  const pathname = usePathname();
  const { lastApplicationId, rememberApplicationId } = useLastApplicationId();
  const pathApplicationId = applicationIdFromPath(pathname);
  const inAppWorkspace = isAppWorkspacePath(pathname) && Boolean(pathApplicationId);

  const activeApplicationId =
    pathApplicationId ??
    (superAdmin ? lastApplicationId ?? applications[0]?.id : applications[0]?.id);

  useEffect(() => {
    if (pathApplicationId) {
      rememberApplicationId(pathApplicationId);
    }
  }, [pathApplicationId, rememberApplicationId]);

  // Platform and tenant super-admins keep the app sidebar while visiting platform/tenant pages.
  const showAppSidebar =
    Boolean(activeApplicationId) && (superAdmin || tenantSuperAdmin || inAppWorkspace);

  return (
    <div className="flex min-h-screen text-ui">
      {showAppSidebar && activeApplicationId ? (
        <AppSidebar applicationId={activeApplicationId} superAdmin={superAdmin} />
      ) : (
        <PlatformSidebar superAdmin={superAdmin} applications={applications} />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          applications={applications}
          activeApplicationId={activeApplicationId}
          inAppWorkspace={inAppWorkspace}
          onApplicationChange={rememberApplicationId}
        />
        <main className="flex min-h-0 flex-1 flex-col px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
