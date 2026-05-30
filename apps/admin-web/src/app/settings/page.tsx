import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { loadAdminContextSafe } from "@/lib/api/app-workspace";

/** Platform-wide defaults (super admin). Per-app overrides live under /app/[id]/settings. */
export const dynamic = "force-dynamic";

export default async function PlatformSettingsPage() {
  const ctx = await loadAdminContextSafe();

  if (!ctx.platformSuperAdmin) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader
          title="Platform settings"
          description="Global defaults for all applications."
        />
        <p className="rounded-lg border border-ui bg-surface px-4 py-6 text-sm text-muted">
          Platform super-admin access is required. Use the platform admin account (default{" "}
          <code className="text-xs">admin</code> / <code className="text-xs">admin</code>) or sign in
          without <code className="text-xs">SECUREONE_ACT_AS_EMAIL</code>. Application-level settings are
          available under{" "}
          <Link href="/app" className="text-brand hover:underline">
            Application console → Settings
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Platform settings"
        description="Global defaults inherited by all applications unless overridden."
      />
      <SettingsTabs scope={{ mode: "platform" }} />
    </div>
  );
}
