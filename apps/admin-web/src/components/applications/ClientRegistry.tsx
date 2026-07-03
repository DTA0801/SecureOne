"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Field";
import { Select } from "@/components/ui/Field";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { statusTone } from "@/lib/status";
import type { ApplicationProduct, AppType, OAuthClient, Tenant } from "@/lib/types";
import { NoOAuthClientsPanel } from "@/components/applications/NoOAuthClientsPanel";

const TYPE_LABEL: Record<AppType, string> = {
  web: "Web (confidential)",
  spa: "SPA (public)",
  native: "Native (public)",
  m2m: "M2M",
};

export function ClientRegistry({
  clients,
  tenants,
  applications,
}: {
  clients: OAuthClient[];
  tenants: Tenant[];
  applications: ApplicationProduct[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [tenantFilter, setTenantFilter] = useState("");
  const [applicationFilter, setApplicationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const tenantMap = useMemo(() => new Map(tenants.map((t) => [t.id, t.name])), [tenants]);
  const applicationMap = useMemo(
    () => new Map(applications.map((a) => [a.id, a.name])),
    [applications],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((c) => {
      if (tenantFilter && c.tenantId !== tenantFilter) return false;
      if (applicationFilter && c.applicationId !== applicationFilter) return false;
      if (typeFilter && c.type !== typeFilter) return false;
      if (statusFilter && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        c.applicationName.toLowerCase().includes(q) ||
        c.clientId.toLowerCase().includes(q)
      );
    });
  }, [clients, query, tenantFilter, applicationFilter, typeFilter, statusFilter]);

  if (clients.length === 0) {
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
            placeholder="Client ID, application name…"
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
        <div className="min-w-[160px]">
          <label className="mb-1 block text-xs font-medium text-muted">Application</label>
          <Select value={applicationFilter} onChange={(e) => setApplicationFilter(e.target.value)}>
            <option value="">All applications</option>
            {applications.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
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
            <TH>OAuth client</TH>
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
              <TD colSpan={7} className="py-8 text-center text-sm text-muted">
                No clients match your filters.
              </TD>
            </tr>
          ) : (
            filtered.map((c) => (
              <TR
                key={c.id}
                className="cursor-pointer hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                onClick={() => router.push(`/applications/${c.id}`)}
              >
                <TD>
                  <span className="link-brand font-medium">{c.clientId}</span>
                  <p className="font-mono text-xs text-faint">{c.id}</p>
                </TD>
                <TD>
                  <Link
                    href={`/app/${c.applicationId}/users`}
                    className="text-sm text-brand hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {applicationMap.get(c.applicationId) ?? c.applicationName}
                  </Link>
                </TD>
                <TD className="text-muted">{tenantMap.get(c.tenantId) ?? c.tenantId}</TD>
                <TD>
                  <Badge tone="indigo">{TYPE_LABEL[c.type]}</Badge>
                </TD>
                <TD>
                  <div className="flex flex-col gap-0.5 text-xs text-muted">
                    <span>{c.confidential ? "Confidential" : "Public"}</span>
                    {c.pkceRequired && <span>PKCE required</span>}
                  </div>
                </TD>
                <TD>
                  <div className="flex max-w-[200px] flex-wrap gap-1">
                    {c.grantTypes.slice(0, 3).map((g) => (
                      <span
                        key={g}
                        className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[10px] dark:bg-white/10"
                      >
                        {g.replace("urn:ietf:params:oauth:grant-type:", "")}
                      </span>
                    ))}
                    {c.grantTypes.length > 3 && (
                      <span className="text-[10px] text-faint">+{c.grantTypes.length - 3}</span>
                    )}
                  </div>
                </TD>
                <TD>
                  <Badge tone={statusTone(c.status)} dot className="capitalize">
                    {c.status}
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
