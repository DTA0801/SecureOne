import type { BadgeTone } from "@/components/ui/Badge";
import type { Status } from "./types";

export function statusTone(status: Status): BadgeTone {
  switch (status) {
    case "active":
      return "success";
    case "invited":
      return "info";
    case "suspended":
      return "danger";
    case "disabled":
      return "neutral";
    default:
      return "neutral";
  }
}

export function planTone(plan: string): BadgeTone {
  switch (plan) {
    case "enterprise":
      return "indigo";
    case "team":
      return "info";
    default:
      return "neutral";
  }
}
