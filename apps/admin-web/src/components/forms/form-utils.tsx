"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { FormState } from "@/lib/actions";

/** Closes the modal and refreshes server components once an action succeeds. */
export function useCloseOnSuccess(state: FormState, close: () => void) {
  const router = useRouter();
  useEffect(() => {
    if (state.ok) {
      router.refresh();
      close();
    }
  }, [state.ok, close, router]);
}

export function FormError({ state }: { state: FormState }) {
  if (state.ok || !state.error) return null;
  return (
    <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
      {state.error}
    </p>
  );
}

export function FormActions({
  pending,
  close,
  submitLabel = "Save",
}: {
  pending: boolean;
  close: () => void;
  submitLabel?: string;
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button type="button" variant="secondary" onClick={close} disabled={pending}>
        Cancel
      </Button>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </div>
  );
}

export function CheckboxGroup({
  name,
  options,
  selected,
}: {
  name: string;
  options: { value: string; label: string; hint?: string }[];
  selected: string[];
}) {
  return (
    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
      {options.map((o) => (
        <label
          key={o.value}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm hover:bg-ui-elevated dark:border-white/10 dark:hover:bg-white/[0.03]"
        >
          <input
            type="checkbox"
            name={name}
            value={o.value}
            defaultChecked={selected.includes(o.value)}
            className="h-4 w-4 accent-[var(--ui-primary)]"
          />
          <span className="min-w-0">
            <span className="block truncate">{o.label}</span>
            {o.hint && <span className="block truncate text-xs text-faint">{o.hint}</span>}
          </span>
        </label>
      ))}
    </div>
  );
}
