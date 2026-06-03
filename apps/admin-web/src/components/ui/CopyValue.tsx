"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export function CopyValue({
  value,
  label = "Copy",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "rounded-md border border-ui px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-ui-muted hover:text-ui",
        className,
      )}
    >
      {copied ? "Copied" : label}
    </button>
  );
}
