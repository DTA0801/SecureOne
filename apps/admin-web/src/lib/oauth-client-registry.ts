import type { AdminContext } from "@/lib/api/context";
import { isTenantSuperAdmin } from "@/lib/operator-access";

export function hasOAuthClients(ctx: Pick<AdminContext, "oauthClientCount">): boolean {
  return (ctx.oauthClientCount ?? 0) > 0;
}

export type NoOAuthClientsVariant = "platform_admin" | "tenant_super_admin" | "tenant_operator";

export function noOAuthClientsVariant(ctx: AdminContext): NoOAuthClientsVariant {
  if (ctx.platformSuperAdmin) return "platform_admin";
  if (isTenantSuperAdmin(ctx)) return "tenant_super_admin";
  return "tenant_operator";
}
