"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import type { SidebarNavChild } from "./nav";

function childActive(pathname: string, child: SidebarNavChild): boolean {
  if (child.isActive) return child.isActive(pathname);
  return pathname === child.href || pathname.startsWith(`${child.href}/`);
}

export function SidebarNavGroup({
  label,
  children,
  pathname,
  defaultOpen,
}: {
  label: string;
  children: SidebarNavChild[];
  pathname: string;
  defaultOpen?: boolean;
}) {
  const groupActive = children.some((child) => childActive(pathname, child));
  const [open, setOpen] = useState(defaultOpen ?? groupActive);

  useEffect(() => {
    if (groupActive) setOpen(true);
  }, [groupActive]);

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
          groupActive ? "font-medium text-ui" : "text-soft hover:bg-ui-elevated",
        )}
        aria-expanded={open}
      >
        <span>{label}</span>
        <span
          className={cn(
            "shrink-0 text-[10px] text-faint transition-transform duration-200",
            open ? "rotate-180" : "",
          )}
          aria-hidden
        >
          ▼
        </span>
      </button>
      {open && (
        <div className="ml-3 flex flex-col gap-0.5 border-l border-ui pl-2">
          {children.map((child) => {
            const active = childActive(pathname, child);
            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "rounded-lg px-2.5 py-2 text-sm transition-colors",
                  active ? "bg-brand font-medium text-on-brand" : "text-soft hover:bg-ui-elevated",
                )}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
