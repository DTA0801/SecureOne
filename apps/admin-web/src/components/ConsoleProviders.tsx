"use client";

import { usePathname } from "next/navigation";
import { AdminContextProvider } from "./AdminContextProvider";
import { ConsoleShell } from "./ConsoleShell";
import type { AdminContext } from "@/lib/api/context";

export function ConsoleProviders({
  children,
  adminContext,
}: {
  children: React.ReactNode;
  adminContext: AdminContext;
}) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <AdminContextProvider value={adminContext}>
      <ConsoleShell
        superAdmin={adminContext.platformSuperAdmin}
        applications={adminContext.applications}
      >
        {children}
      </ConsoleShell>
    </AdminContextProvider>
  );
}
