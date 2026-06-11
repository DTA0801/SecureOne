import { redirect } from "next/navigation";
import { loadAdminContextSafe } from "@/lib/api/app-workspace";
import { buildAppPath } from "@/lib/app-routes";

export default async function HomePage() {
  const ctx = await loadAdminContextSafe();
  if (
    (ctx.operatorTier === "tenant" || ctx.operatorTier === "tenant_super") &&
    ctx.applications.length > 0
  ) {
    redirect(buildAppPath(ctx.applications[0].id, "users"));
  }
  if (ctx.applications.length > 0) {
    redirect(buildAppPath(ctx.applications[0].id, "users"));
  }
  if (ctx.platformSuperAdmin) {
    redirect("/applications");
  }
  redirect("/login");
}
