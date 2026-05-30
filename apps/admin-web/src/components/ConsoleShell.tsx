"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "./AppSidebar";
import { PlatformSidebar } from "./PlatformSidebar";
import { Topbar } from "./Topbar";
import { applicationIdFromPath } from "@/lib/app-routes";
import type { ApplicationContextItem } from "@/lib/api/context";

export function ConsoleShell({
  children,
  superAdmin,
  applications,
}: {
  children: React.ReactNode;
  superAdmin: boolean;
  applications: ApplicationContextItem[];
}) {
  const pathname = usePathname();
  const applicationId =
    applicationIdFromPath(pathname) ?? applications[0]?.id;
  const useAppSidebar = Boolean(applicationId);

  return (
    <div className="flex min-h-screen text-ui">
      {useAppSidebar ? (
        <AppSidebar applicationId={applicationId!} superAdmin={superAdmin} />
      ) : (
        <PlatformSidebar superAdmin={superAdmin} applications={applications} />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar applications={applications} />
        <main className="flex min-h-0 flex-1 flex-col px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
