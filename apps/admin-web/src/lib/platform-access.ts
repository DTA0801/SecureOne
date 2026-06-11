import { notFound } from "next/navigation";
import { loadAdminContextSafe } from "@/lib/api/app-workspace";
import type { AdminContext } from "@/lib/api/context";

/** Platform operator only (not tenant admin, not act-as). */
export async function getPlatformAccessContext(): Promise<AdminContext> {
  return loadAdminContextSafe();
}

export async function requirePlatformAccess(): Promise<AdminContext> {
  const ctx = await getPlatformAccessContext();
  if (!ctx.platformSuperAdmin) {
    notFound();
  }
  return ctx;
}

/** Tenant console operator (not platform super-admin). */
export async function requireTenantOperatorAccess(): Promise<AdminContext> {
  const ctx = await getPlatformAccessContext();
  if (
    ctx.platformSuperAdmin ||
    (ctx.operatorTier !== "tenant" && ctx.operatorTier !== "tenant_super")
  ) {
    notFound();
  }
  return ctx;
}
