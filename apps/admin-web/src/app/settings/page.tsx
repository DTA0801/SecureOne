import { PageHeader } from "@/components/ui/PageHeader";
import { PlatformSettingsEditor } from "@/components/applications/PlatformSettingsEditor";
import { requirePlatformAccess } from "@/lib/platform-access";

/** Platform-wide defaults (platform operator only). Per-app overrides live under /app/[id]/settings. */
export const dynamic = "force-dynamic";

export default async function PlatformSettingsPage() {
  await requirePlatformAccess();

  return (
    <div className="w-full min-w-0">
      <PageHeader
        title="Platform settings"
        description="Global defaults inherited by all applications unless overridden."
      />
      <PlatformSettingsEditor />
    </div>
  );
}
