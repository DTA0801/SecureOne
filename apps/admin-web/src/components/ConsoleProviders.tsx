"use client";

import { ConsoleShell } from "./ConsoleShell";
import type { ApplicationContextItem } from "@/lib/api/context";

export function ConsoleProviders({
  children,
  superAdmin,
  applications,
}: {
  children: React.ReactNode;
  superAdmin: boolean;
  applications: ApplicationContextItem[];
}) {
  return (
    <ConsoleShell superAdmin={superAdmin} applications={applications}>
      {children}
    </ConsoleShell>
  );
}
