"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ActionNotice } from "@/components/users/SecuritySection";
import {
  markUserEmailVerifiedApi,
  resendUserVerificationEmailApi,
  setUserEmailVerifiedApi,
} from "@/lib/api/users";

export function UserEmailActions({
  userId,
  userEmail,
  emailVerified,
  applicationId,
  onChanged,
}: {
  userId: string;
  userEmail?: string;
  emailVerified: boolean;
  applicationId?: string;
  onChanged?: () => void | Promise<void>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function run(label: string, action: () => Promise<unknown>) {
    setBusy(true);
    setNotice(null);
    try {
      await action();
      setNotice(label);
      if (onChanged) await onChanged();
      else router.refresh();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not complete action.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {userEmail && (
        <p className="text-xs text-muted">
          Verification mail goes to <strong className="font-medium text-ui">{userEmail}</strong>.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {!emailVerified && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() =>
              run(
                "Verification email sent. User must click the link in their inbox.",
                () => resendUserVerificationEmailApi(userId, applicationId),
              )
            }
          >
            Resend verification email
          </Button>
        )}
        {!emailVerified && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={busy}
            onClick={() =>
              run("Email marked verified. User can sign in if password and status allow.", () =>
                markUserEmailVerifiedApi(userId, applicationId),
              )
            }
          >
            Verify email (allow sign-in)
          </Button>
        )}
        {emailVerified && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() =>
              run("Email marked unverified. Password sign-in blocked until verified again.", () =>
                setUserEmailVerifiedApi(userId, false, applicationId),
              )
            }
          >
            Mark unverified
          </Button>
        )}
      </div>
      {notice && (
        <ActionNotice
          message={notice}
          tone={notice.includes("Could not") ? "error" : "success"}
        />
      )}
    </div>
  );
}
