import type { FeatureFlag } from "@/lib/types";

export function isFeatureEnabled(flags: FeatureFlag[], key: string, fallback = false): boolean {
  const flag = flags.find((f) => f.key === key);
  return flag ? flag.enabled : fallback;
}
