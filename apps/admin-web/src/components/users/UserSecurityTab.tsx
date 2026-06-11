"use client";

import { Button } from "@/components/ui/Button";
import { SecuritySection } from "@/components/users/SecuritySection";
import { UserAccountSecurityActions } from "@/components/users/UserAccountSecurityActions";
import { UserEmailActions } from "@/components/users/UserEmailActions";
import { UserPasswordActions } from "@/components/users/UserPasswordActions";
import type { User } from "@/lib/types";

export function UserSecurityTab({
  user,
  applicationId,
  mfaFactorCount = 0,
  showMfaLink = false,
  onChanged,
  onOpenMfaTab,
  onOpenSignInsTab,
}: {
  user: User;
  applicationId?: string;
  mfaFactorCount?: number;
  showMfaLink?: boolean;
  onChanged?: () => void | Promise<void>;
  onOpenMfaTab?: () => void;
  onOpenSignInsTab?: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <SecuritySection
        title="Account access"
        description="Status, lockout, and suspension. Suspended users cannot sign in."
      >
        <UserAccountSecurityActions user={user} onChanged={onChanged} />
      </SecuritySection>

      <SecuritySection
        title="Email verification"
        description="Unverified users cannot use password sign-in. They can confirm via inbox link or you can verify manually in Edit user."
      >
        <UserEmailActions
          userId={user.id}
          userEmail={user.email}
          emailVerified={user.emailVerified}
          applicationId={applicationId}
          onChanged={onChanged}
        />
      </SecuritySection>

      <SecuritySection
        title="Password & credentials"
        description="Email links for self-service password setup, or set/remove the password directly as admin."
      >
        <UserPasswordActions
          userId={user.id}
          userEmail={user.email}
          hasPassword={user.hasPassword ?? false}
          applicationId={applicationId}
          onChanged={onChanged}
        />
      </SecuritySection>

      <SecuritySection
        title="Multi-factor authentication"
        description={
          mfaFactorCount > 0
            ? `${mfaFactorCount} factor(s) enrolled. Manage factors on the MFA tab.`
            : "No MFA factors enrolled for this user yet."
        }
      >
        <div className="flex flex-wrap gap-2">
          {showMfaLink && onOpenMfaTab && (
            <Button type="button" variant="secondary" size="sm" onClick={onOpenMfaTab}>
              Manage MFA
            </Button>
          )}
          {onOpenSignInsTab && (
            <Button type="button" variant="ghost" size="sm" onClick={onOpenSignInsTab}>
              View sign-in history
            </Button>
          )}
        </div>
      </SecuritySection>
    </div>
  );
}
