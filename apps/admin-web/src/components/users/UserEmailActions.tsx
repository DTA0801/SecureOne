"use client";

import { Button } from "@/components/ui/Button";
import {
  userMarkEmailVerifiedAction,
  userResendVerificationEmailAction,
  userSendPasswordResetEmailAction,
} from "@/lib/actions";

export function UserEmailActions({
  userId,
  emailVerified,
}: {
  userId: string;
  emailVerified: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {!emailVerified && (
        <form action={userResendVerificationEmailAction}>
          <input type="hidden" name="id" value={userId} />
          <Button type="submit" variant="secondary" size="sm">
            Resend verification email
          </Button>
        </form>
      )}
      {!emailVerified && (
        <form action={userMarkEmailVerifiedAction}>
          <input type="hidden" name="id" value={userId} />
          <Button type="submit" variant="ghost" size="sm">
            Mark verified
          </Button>
        </form>
      )}
      <form action={userSendPasswordResetEmailAction}>
        <input type="hidden" name="id" value={userId} />
        <Button type="submit" variant="ghost" size="sm">
          Send password reset email
        </Button>
      </form>
    </div>
  );
}
