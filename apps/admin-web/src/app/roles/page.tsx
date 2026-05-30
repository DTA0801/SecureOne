import { redirect } from "next/navigation";
import { loadAdminContextSafe } from "@/lib/api/app-workspace";
import { buildAppPath } from "@/lib/app-routes";

export default async function RolesRedirectPage() {
  const ctx = await loadAdminContextSafe();
  if (ctx.applications.length > 0) {
    redirect(buildAppPath(ctx.applications[0].id, "roles"));
  }
  redirect("/app");
}
