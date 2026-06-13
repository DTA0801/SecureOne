"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Field";
import { Select } from "@/components/ui/Field";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { statusTone } from "@/lib/status";
import type { Application, AppType, Tenant } from "@/lib/types";
import { NoOAuthClientsPanel } from "@/components/applications/NoOAuthClientsPanel";

const TYPE_LABEL: Record<AppType, string> = {
  web: "Web (confidential)",
  spa: "SPA (public)",
  native: "Native (public)",
  m2m: "M2M",
};

export function ClientRegistry({
  apps,
  tenants,
}: {
  apps: Application[];
  tenants: Tenant[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [tenantFilter, setTenantFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const tenantMap = useMemo(() => new Map(tenants.map((t) => [t.id, t.name])), [tenants]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return apps.filter((a) => {
      if (tenantFilter && a.tenantId !== tenantFilter) return false;
      if (typeFilter && a.type !== typeFilter) return false;
      if (statusFilter && a.status !== statusFilter) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.clientId.toLowerCase().includes(q) ||
        (a.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [apps, query, tenantFilter, typeFilter, statusFilter]);

  if (apps.length === 0) {
    return (
      <NoOAuthClientsPanel
        variant="platform_admin"
        className="border-dashed p-8 text-center"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-ui bg-surface p-4">
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs font-medium text-muted">Search</label>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, client ID, description…"
          />
        </div>
        <div className="min-w-[160px]">
          <label className="mb-1 block text-xs font-medium text-muted">Tenant</label>
          <Select value={tenantFilter} onChange={(e) => setTenantFilter(e.target.value)}>
            <option value="">All tenants</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-muted">Type</label>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All types</option>
            {(Object.keys(TYPE_LABEL) as AppType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-[120px]">
          <label className="mb-1 block text-xs font-medium text-muted">Status</label>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
            <option value="suspended">Suspended</option>
          </Select>
        </div>
      </div>

      <Table>
        <THead>
          <tr>
            <TH>Application</TH>
            <TH>Tenant</TH>
            <TH>Type</TH>
            <TH>Security</TH>
            <TH>Grants</TH>
            <TH>Status</TH>
          </tr>
        </THead>
        <TBody>
          {filtered.length === 0 ? (
            <tr>
              <TD colSpan={6} className="py-8 text-center text-sm text-muted">
                No clients match your filters.
              </TD>
            </tr>
          ) : (
            filtered.map((a) => (
              <TR
                key={a.id}
                className="cursor-pointer hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                onClick={() => router.push(`/applications/${a.id}`)}
              >
                <TD>
                  <span className="link-brand font-medium">{a.name}</span>
                  <p className="font-mono text-xs text-faint">{a.clientId}</p>
                  {a.description && <p className="mt-0.5 text-xs text-muted line-clamp-1">{a.description}</p>}
                </TD>
                <TD className="text-muted">{tenantMap.get(a.tenantId) ?? a.tenantId}</TD>
                <TD>
                  <Badge tone="indigo">{TYPE_LABEL[a.type]}</Badge>
                </TD>
                <TD>
                  <div className="flex flex-col gap-0.5 text-xs text-muted">
                    <span>{a.confidential ? "Confidential" : "Public"}</span>
                    {a.pkceRequired && <span>PKCE required</span>}
                  </div>
                </TD>
                <TD>
                  <div className="flex max-w-[200px] flex-wrap gap-1">
                    {a.grantTypes.slice(0, 3).map((g) => (
                      <span
                        key={g}
                        className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[10px] dark:bg-white/10"
                      >
                        {g.replace("urn:ietf:params:oauth:grant-type:", "")}
                      </span>
                    ))}
                    {a.grantTypes.length > 3 && (
                      <span className="text-[10px] text-faint">+{a.grantTypes.length - 3}</span>
                    )}
                  </div>
                </TD>
                <TD>
                  <Badge tone={statusTone(a.status)} dot className="capitalize">
                    {a.status}
                  </Badge>
                </TD>
              </TR>
            ))
          )}
        </TBody>
      </Table>
    </div>
  );
}
