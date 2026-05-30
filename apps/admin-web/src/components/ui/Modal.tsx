"use client";

import { useEffect, useState } from "react";
import { Button } from "./Button";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export function Modal({
  triggerLabel,
  triggerVariant = "primary",
  triggerSize = "md",
  title,
  description,
  width = "md",
  children,
}: {
  triggerLabel: React.ReactNode;
  triggerVariant?: Variant;
  triggerSize?: "sm" | "md";
  title: string;
  description?: string;
  width?: "md" | "lg";
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <Button variant={triggerVariant} size={triggerSize} onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className={cn(
              "relative z-10 my-4 w-full rounded-2xl border border-black/10 bg-[var(--background)] shadow-2xl dark:border-white/10",
              width === "lg" ? "max-w-2xl" : "max-w-lg",
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-black/10 px-5 py-4 dark:border-white/10">
              <div>
                <h2 className="text-base font-semibold">{title}</h2>
                {description && (
                  <p className="mt-0.5 text-xs text-black/50 dark:text-white/50">{description}</p>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-lg px-2 text-lg leading-none text-black/40 hover:bg-black/5 dark:text-white/40 dark:hover:bg-white/10"
              >
                ×
              </button>
            </div>
            <div className="p-5">{children(() => setOpen(false))}</div>
          </div>
        </div>
      )}
    </>
  );
}
