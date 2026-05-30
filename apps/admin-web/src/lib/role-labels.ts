import type { BadgeTone } from "@/components/ui/Badge";
import type { RoleLabel } from "@/lib/types";

export const ROLE_LABEL_META: Record<
  RoleLabel,
  { title: string; description: string; tone: BadgeTone }
> = {
  SYSTEM: {
    title: "System",
    description: "Platform-managed; name locked, cannot delete",
    tone: "danger",
  },
  BUILT_IN: {
    title: "Built-in",
    description: "Default role template for new users",
    tone: "info",
  },
  COMPOSITE: {
    title: "Composite",
    description: "Inherits permissions from child roles",
    tone: "indigo",
  },
  CUSTOM: {
    title: "Custom",
    description: "Tenant-defined role",
    tone: "neutral",
  },
};
