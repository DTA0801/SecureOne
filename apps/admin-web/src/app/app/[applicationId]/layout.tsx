import { redirect } from "next/navigation";
import { loadAdminContextSafe } from "@/lib/api/app-workspace";
import { hasOAuthClients } from "@/lib/oauth-client-registry";

export default async function AppWorkspaceGuardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await loadAdminContextSafe();
  if (!hasOAuthClients(ctx)) {
    redirect("/app");
  }
  return children;
}
