import type { PasswordPolicy, PasswordRequirement } from "@/lib/types";

export function buildPasswordRequirements(policy: PasswordPolicy): PasswordRequirement[] {
  const rules: PasswordRequirement[] = [
    { key: "minLength", label: `At least ${policy.minLength} characters` },
  ];
  if (policy.requireUppercase) {
    rules.push({ key: "uppercase", label: "One uppercase letter (A–Z)" });
  }
  if (policy.requireNumber) {
    rules.push({ key: "number", label: "One number (0–9)" });
  }
  if (policy.requireSymbol) {
    rules.push({ key: "symbol", label: "One symbol (!@#$… )" });
  }
  if (policy.historyCount > 0) {
    rules.push({
      key: "history",
      label: `Must not match your last ${policy.historyCount} password(s)`,
    });
  }
  if (policy.expiryDays > 0) {
    rules.push({
      key: "expiry",
      label: `Password expires after ${policy.expiryDays} day(s)`,
    });
  }
  return rules;
}

export type PasswordRequirementStatus = PasswordRequirement & { met: boolean };

export function evaluatePasswordPolicy(
  password: string,
  policy: PasswordPolicy,
): PasswordRequirementStatus[] {
  const value = password ?? "";
  const out: PasswordRequirementStatus[] = [
    {
      key: "minLength",
      label: `At least ${policy.minLength} characters`,
      met: value.length >= policy.minLength,
    },
  ];
  if (policy.requireUppercase) {
    out.push({
      key: "uppercase",
      label: "One uppercase letter (A–Z)",
      met: /[A-Z]/.test(value),
    });
  }
  if (policy.requireNumber) {
    out.push({
      key: "number",
      label: "One number (0–9)",
      met: /[0-9]/.test(value),
    });
  }
  if (policy.requireSymbol) {
    out.push({
      key: "symbol",
      label: "One symbol (!@#$… )",
      met: /[^a-zA-Z0-9]/.test(value),
    });
  }
  return out;
}

export function passwordMeetsPolicy(password: string, policy: PasswordPolicy): boolean {
  return evaluatePasswordPolicy(password, policy).every((r) => r.met);
}
