import type { AdminContext } from "@/lib/api/context";

export function isTenantSuperAdmin(ctx: Pick<AdminContext, "operatorTier" | "platformSuperAdmin">): boolean {
  return ctx.operatorTier === "tenant_super" && !ctx.platformSuperAdmin;
}

export function canAccessTenantGovernance(
  ctx: Pick<AdminContext, "operatorTier" | "platformSuperAdmin">,
): boolean {
  return ctx.platformSuperAdmin || isTenantSuperAdmin(ctx);
}
