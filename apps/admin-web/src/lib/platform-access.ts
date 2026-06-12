import { notFound } from "next/navigation";
import { loadAdminContextSafe } from "@/lib/api/app-workspace";
import type { AdminContext } from "@/lib/api/context";
import { canAccessTenantGovernance, isTenantSuperAdmin } from "@/lib/operator-access";

export { canAccessTenantGovernance, isTenantSuperAdmin } from "@/lib/operator-access";

/** Platform operator only (not tenant admin, not act-as). */
export async function getPlatformAccessContext(): Promise<AdminContext> {
  return loadAdminContextSafe();
}

/** Platform super-admin or tenant super-admin (own tenant only). */
export async function requireTenantGovernanceAccess(): Promise<AdminContext> {
  const ctx = await getPlatformAccessContext();
  if (!canAccessTenantGovernance(ctx)) {
    notFound();
  }
  return ctx;
}

/** Ensures tenant super-admins cannot open another tenant's pages. */
export function assertTenantScope(ctx: AdminContext, tenantId: string): void {
  if (ctx.platformSuperAdmin) return;
  if (isTenantSuperAdmin(ctx) && ctx.tenantId === tenantId) return;
  notFound();
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
