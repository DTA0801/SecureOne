"use client";

import { useState } from "react";
import { LiveApiResponse } from "@/components/settings/LiveApiResponse";
import { CopyValue } from "@/components/ui/CopyValue";
import { cn } from "@/lib/cn";
import type { ApiField, IntegrationApiEndpoint } from "@/lib/integration-api-catalog";

function MethodBadge({ method }: { method: string }) {
  const tone =
    method === "GET"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      : method === "POST"
        ? "bg-blue-500/15 text-blue-700 dark:text-blue-300"
        : "bg-black/10 dark:bg-white/10";
  return (
    <span className={cn("rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold", tone)}>
      {method}
    </span>
  );
}

function FieldsTable({ title, fields }: { title: string; fields: ApiField[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{title}</p>
      <div className="overflow-x-auto rounded-lg border border-ui">
        <table className="w-full text-left text-xs">
          <thead className="bg-black/5 dark:bg-white/5">
            <tr>
              <th className="px-3 py-2 font-medium text-muted">Field</th>
              <th className="px-3 py-2 font-medium text-muted">Type</th>
              <th className="px-3 py-2 font-medium text-muted">Required</th>
              <th className="px-3 py-2 font-medium text-muted">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ui">
            {fields.map((f) => (
              <tr key={f.name}>
                <td className="px-3 py-2 font-mono text-ui">{f.name}</td>
                <td className="px-3 py-2 text-muted">{f.type}</td>
                <td className="px-3 py-2 text-muted">{f.required ? "Yes" : "No"}</td>
                <td className="px-3 py-2 text-muted">{f.description ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <CopyValue value={code} />
      </div>
      <pre className="max-h-64 overflow-auto rounded-lg border border-ui bg-black/5 p-3 font-mono text-[11px] leading-relaxed text-ui dark:bg-white/5">
        {code}
      </pre>
    </div>
  );
}

function EndpointDetails({
  ep,
  applicationId,
}: {
  ep: IntegrationApiEndpoint;
  applicationId?: string;
}) {
  const liveFetchIds = new Set([
    "public-manifest",
    "signup-options",
    "password-forgot",
    "session-login",
  ]);
  const liveFetchUrl = applicationId && liveFetchIds.has(ep.id) ? ep.path : null;

  return (
    <div className="space-y-4 border-t border-ui bg-black/[0.02] px-4 py-4 dark:bg-white/[0.02]">
      {ep.auth && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Authentication</p>
          <p className="mt-1 text-sm text-ui">{ep.auth}</p>
        </div>
      )}
      {ep.contentType && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Content-Type</p>
          <p className="mt-1 font-mono text-sm text-ui">{ep.contentType}</p>
        </div>
      )}
      {ep.queryParams && ep.queryParams.length > 0 && (
        <FieldsTable title="Query parameters" fields={ep.queryParams} />
      )}
      {ep.requestFields && ep.requestFields.length > 0 && (
        <FieldsTable title="Request body" fields={ep.requestFields} />
      )}
      {ep.requestExample && <CodeBlock label="Request example" code={ep.requestExample} />}
      {ep.responses && ep.responses.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Responses</p>
          <div className="space-y-3">
            {ep.responses.map((r) => (
              <div key={r.status} className="rounded-lg border border-ui p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold dark:bg-white/10">
                    {r.status}
                  </span>
                  <span className="text-sm text-ui">{r.description}</span>
                </div>
                {r.example && (
                  <pre className="mt-2 max-h-48 overflow-auto rounded border border-ui bg-black/5 p-2 font-mono text-[11px] text-muted dark:bg-white/5">
                    {r.example}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {ep.notes && ep.notes.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-xs text-muted">
          {ep.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
      {liveFetchUrl && <LiveApiResponse url={liveFetchUrl} />}
    </div>
  );
}

export function ApiReferenceList({
  endpoints,
  applicationId,
}: {
  endpoints: IntegrationApiEndpoint[];
  applicationId?: string;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (endpoints.length === 0) {
    return <p className="px-4 py-6 text-sm text-muted">No endpoints match the selected auth UI mode.</p>;
  }

  return (
    <div className="divide-y divide-ui">
      {endpoints.map((ep) => {
        const isOpen = expanded.has(ep.id);
        return (
          <div key={ep.id}>
            <div className="flex w-full items-start gap-3 px-4 py-3 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
              <button
                type="button"
                onClick={() => toggle(ep.id)}
                className="flex min-w-0 flex-1 items-start gap-3 text-left"
                aria-expanded={isOpen}
              >
                <span
                  className={cn(
                    "mt-0.5 shrink-0 text-xs text-muted transition-transform",
                    isOpen && "rotate-90",
                  )}
                  aria-hidden
                >
                  ▶
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <MethodBadge method={ep.method} />
                    <span className="text-xs text-muted">{ep.group}</span>
                  </div>
                  <code className="mt-1 block break-all font-mono text-xs">{ep.path}</code>
                  <p className="mt-1 text-xs text-muted">{ep.description}</p>
                  {!isOpen && (
                    <p className="mt-1 text-[11px] text-faint">
                      Expand for request types, examples, and responses
                    </p>
                  )}
                </div>
              </button>
              <CopyValue value={ep.path} className="mt-1 shrink-0" />
            </div>
            {isOpen && <EndpointDetails ep={ep} applicationId={applicationId} />}
          </div>
        );
      })}
    </div>
  );
}
