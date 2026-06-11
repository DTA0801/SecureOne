"use client";

import { cn } from "@/lib/cn";
import { evaluatePasswordPolicy } from "@/lib/password-policy";
import type { PasswordPolicy } from "@/lib/types";

export function PasswordPolicyChecklist({
  policy,
  password,
  className,
}: {
  policy: PasswordPolicy;
  password: string;
  className?: string;
}) {
  const rules = evaluatePasswordPolicy(password, policy);
  if (rules.length === 0) return null;

  return (
    <ul className={cn("space-y-1 text-xs", className)} aria-label="Password requirements">
      {rules.map((rule) => (
        <li
          key={rule.key}
          className={cn(
            "flex items-start gap-2",
            rule.met ? "text-emerald-700 dark:text-emerald-400" : "text-muted",
          )}
        >
          <span aria-hidden className="mt-0.5 shrink-0 font-mono text-[10px]">
            {rule.met ? "✓" : "○"}
          </span>
          <span>{rule.label}</span>
        </li>
      ))}
    </ul>
  );
}
