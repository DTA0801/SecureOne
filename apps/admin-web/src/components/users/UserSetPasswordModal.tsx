"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { FieldRow, Input } from "@/components/ui/Field";
import { FormSection } from "@/components/forms/FormSection";
import { userAdminSetPasswordAction, type FormState } from "@/lib/actions";
import { FormActions, FormError, useCloseOnSuccess } from "@/components/forms/form-utils";

const initial: FormState = { ok: false };

export function UserSetPasswordModal({
  userId,
  applicationId,
  triggerLabel = "Set password",
}: {
  userId: string;
  applicationId?: string;
  triggerLabel?: string;
}) {
  return (
    <Modal
      triggerLabel={triggerLabel}
      triggerVariant="secondary"
      triggerSize="sm"
      title="Set password"
      description="Sets a new password immediately (policy rules apply). User should change it after sign-in."
    >
      {(close) => (
        <SetPasswordForm userId={userId} applicationId={applicationId} close={close} />
      )}
    </Modal>
  );
}

function SetPasswordForm({
  userId,
  applicationId,
  close,
}: {
  userId: string;
  applicationId?: string;
  close: () => void;
}) {
  const [state, formAction, pending] = useActionState(userAdminSetPasswordAction, initial);
  useCloseOnSuccess(state, close);

  return (
    <form action={formAction} className="space-y-4 pb-2">
      <input type="hidden" name="id" value={userId} />
      {applicationId && <input type="hidden" name="applicationId" value={applicationId} />}
      <FormError state={state} />
      <FormSection title="New password">
        <FieldRow label="Password" hint="Min 8 characters; must meet app password policy">
          <Input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            disabled={pending}
          />
        </FieldRow>
      </FormSection>
      <FormActions pending={pending} close={close} submitLabel="Set password" sticky />
    </form>
  );
}
