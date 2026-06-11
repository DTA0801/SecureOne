"use client";

import { createContext, useContext } from "react";
import type { AdminContext } from "@/lib/api/context";

const AdminContextReact = createContext<AdminContext | null>(null);

export function AdminContextProvider({
  value,
  children,
}: {
  value: AdminContext;
  children: React.ReactNode;
}) {
  return <AdminContextReact.Provider value={value}>{children}</AdminContextReact.Provider>;
}

export function useAdminContext(): AdminContext {
  const ctx = useContext(AdminContextReact);
  if (!ctx) {
    throw new Error("useAdminContext must be used within AdminContextProvider");
  }
  return ctx;
}
