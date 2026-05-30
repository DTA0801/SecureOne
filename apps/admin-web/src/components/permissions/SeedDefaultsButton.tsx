"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { seedDefaultPermissionsAction } from "@/lib/actions";

/** Installs the standard IAM permission catalog for the current application. */
export function SeedDefaultsButton({
  applicationId,
  missingCount,
}: {
  applicationId: string;
  missingCount?: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() => {
          setMessage(null);
          setError(null);
          startTransition(async () => {
            const result = await seedDefaultPermissionsAction(applicationId);
            if (result.ok) {
              setMessage(
                result.created === 0
                  ? "All default permissions already exist."
                  : `Added ${result.created} default permission(s).`,
              );
              router.refresh();
            } else {
              setError(result.error ?? "Failed to seed permissions");
            }
          });
        }}
      >
        {pending ? "Installing…" : "Install default permissions"}
      </Button>
      {missingCount !== undefined && (
        <span className="text-xs text-muted">
          {missingCount >= 10
            ? "Catalog complete"
            : `${missingCount} of 10 default permissions`}
        </span>
      )}
      {message && <span className="text-xs text-emerald-600 dark:text-emerald-400">{message}</span>}
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}
