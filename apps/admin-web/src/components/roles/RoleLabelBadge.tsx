"use client";

import { Badge } from "@/components/ui/Badge";
import { ROLE_LABEL_META } from "@/lib/role-labels";
import type { RoleLabel } from "@/lib/types";

export function RoleLabelBadge({ label }: { label: RoleLabel | string | undefined }) {
  const resolved =
    label && label in ROLE_LABEL_META ? (label as RoleLabel) : "CUSTOM";
  const meta = ROLE_LABEL_META[resolved];
  return (
    <span title={meta.description}>
      <Badge tone={meta.tone}>{meta.title}</Badge>
    </span>
  );
}
