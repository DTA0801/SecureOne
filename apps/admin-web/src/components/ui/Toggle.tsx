"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export function Toggle({
  defaultOn = false,
  onChange,
  "aria-label": ariaLabel,
}: {
  defaultOn?: boolean;
  onChange?: (on: boolean) => void;
  "aria-label"?: string;
}) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      onClick={() => {
        const next = !on;
        setOn(next);
        onChange?.(next);
      }}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50",
        on ? "bg-indigo-600" : "bg-black/15 dark:bg-white/20",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
          on ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
