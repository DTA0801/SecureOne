import { redirect } from "next/navigation";
import { loadAdminContextSafe } from "@/lib/api/app-workspace";
import type { AdminContext } from "@/lib/api/context";

/** Any signed-in console operator may read documentation. */
export async function requireConfluenceAccess(): Promise<AdminContext> {
  const ctx = await loadAdminContextSafe();
  if (!ctx.principal?.trim()) {
    redirect("/login?next=/confluence");
  }
  return ctx;
}
