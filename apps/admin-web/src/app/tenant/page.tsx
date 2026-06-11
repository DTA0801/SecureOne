import { redirect } from "next/navigation";
import { loadAdminContextSafe } from "@/lib/api/app-workspace";
import { buildAppPath } from "@/lib/app-routes";

/** Legacy route — tenant operators use the application console only. */
export default async function TenantLegacyRedirectPage() {
  const ctx = await loadAdminContextSafe();
  if (ctx.applications.length > 0) {
    redirect(buildAppPath(ctx.applications[0].id, "users"));
  }
  redirect("/login");
}
