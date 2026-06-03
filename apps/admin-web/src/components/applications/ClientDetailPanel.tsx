"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApplicationFormModal } from "@/components/forms/ApplicationFormModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CopyValue } from "@/components/ui/CopyValue";
import { useToast } from "@/components/ui/Toast";
import { applicationDeleteAction } from "@/lib/actions";
import { rotateApplicationSecretApi } from "@/lib/api/applications";
import { AUTH_SERVER_URL } from "@/lib/config";
import { formatDate } from "@/lib/format";
import { statusTone } from "@/lib/status";
import type { Application, Tenant } from "@/lib/types";

const TYPE_LABEL: Record<Application["type"], string> = {
  web: "Web application (confidential)",
  spa: "Single-page application (public)",
  native: "Native / mobile (public)",
  m2m: "Machine-to-machine (confidential)",
};

export function ClientDetailPanel({
  app,
  tenant,
}: {
  app: Application;
  tenant: Tenant | null;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);
  const discoveryUrl = `${AUTH_SERVER_URL}/.well-known/openid-configuration`;

  async function rotateSecret() {
    setRotating(true);
    try {
      const secret = await rotateApplicationSecretApi(app.id);
      setRevealedSecret(secret);
      toast("New client secret generated — copy it now; it will not be shown again.", "success");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Rotate failed", "error");
    } finally {
      setRotating(false);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Enterprise OAuth client registry — credentials, protocol endpoints, and security policy. User,
        role, and policy operations live in the{" "}
        <Link href={`/app/${app.id}/users`} className="text-brand hover:underline">
          application console
        </Link>
        .
      </p>

      {revealedSecret && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3">
          <p className="text-sm font-medium text-ui">Client secret (shown once)</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="break-all rounded bg-black/10 px-2 py-1 font-mono text-sm dark:bg-white/10">
              {revealedSecret}
            </code>
            <CopyValue value={revealedSecret} />
          </div>
          <p className="mt-2 text-xs text-muted">Store this in your vault. It cannot be retrieved later.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card padded={false}>
          <CardHeader title="Client credentials" />
          <div className="space-y-4 p-5 text-sm">
            <Field label="Client ID">
              <div className="flex flex-wrap items-center gap-2">
                <code className="font-mono text-sm">{app.clientId}</code>
                <CopyValue value={app.clientId} />
              </div>
            </Field>
            <Field label="Client type" value={<Badge tone="indigo">{TYPE_LABEL[app.type]}</Badge>} />
            <Field
              label="Client authentication"
              value={
                app.confidential
                  ? `${app.tokenEndpointAuthMethod} · secret ${app.clientSecretConfigured ? "configured" : "missing"}`
                  : "Public client (no secret)"
              }
            />
            {app.confidential && (
              <div>
                <Button variant="secondary" size="sm" onClick={rotateSecret} disabled={rotating}>
                  {rotating ? "Rotating…" : "Rotate client secret"}
                </Button>
              </div>
            )}
            {app.description && <Field label="Description" value={app.description} />}
            <Field label="Tenant" value={tenant?.name ?? app.tenantId} />
            <Field label="Last updated" value={formatDate(app.updatedAt)} />
          </div>
        </Card>

        <Card padded={false}>
          <CardHeader title="Security policy" />
          <div className="space-y-3 p-5 text-sm">
            <Field label="PKCE required" value={app.pkceRequired ? "Yes (OAuth 2.1)" : "No"} />
            <Field label="Grant types" value={app.grantTypes.join(", ") || "—"} />
            <Field label="Scopes" value={app.scopes.join(", ") || "—"} />
            <Field label="Status" value={<Badge tone={statusTone(app.status)} dot className="capitalize">{app.status}</Badge>} />
          </div>
        </Card>

        <Card padded={false} className="lg:col-span-2">
          <CardHeader
            title="OAuth 2.1 / OIDC endpoints"
            description="Share with application teams integrating with SecureOne"
          />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <EndpointRow label="Issuer" value={app.oAuthEndpoints.issuer} />
            <EndpointRow label="Authorization" value={app.oAuthEndpoints.authorizationEndpoint} />
            <EndpointRow label="Token" value={app.oAuthEndpoints.tokenEndpoint} />
            <EndpointRow label="JWKS" value={app.oAuthEndpoints.jwksUri} />
            <EndpointRow label="Discovery" value={discoveryUrl} />
          </div>
        </Card>

        <Card padded={false}>
          <CardHeader title="Redirect URIs" />
          <UriList uris={app.redirectUris} empty="No redirect URIs configured." />
        </Card>

        <Card padded={false}>
          <CardHeader title="Post-logout redirect URIs" />
          <UriList uris={app.postLogoutRedirectUris} empty="None (optional for OIDC logout)." />
        </Card>
      </div>

      <Card className="border-red-500/20" padded={false}>
        <CardHeader title="Danger zone" />
        <div className="flex items-center justify-between p-5">
          <p className="text-sm text-muted">Permanently remove this OAuth client and its configuration.</p>
          <ConfirmDialog
            action={applicationDeleteAction}
            id={app.id}
            triggerLabel="Delete client"
            title={`Delete ${app.name}?`}
            message="Users and audit history may remain; client credentials will stop working immediately."
            confirmLabel="Delete"
          />
        </div>
      </Card>
    </div>
  );
}

function Field({ label, value, children }: { label: string; value?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      {children ?? value}
    </div>
  );
}

function EndpointRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <code className="break-all font-mono text-xs text-ui">{value}</code>
        <CopyValue value={value} label="Copy" />
      </div>
    </div>
  );
}

function UriList({ uris, empty }: { uris: string[]; empty: string }) {
  if (uris.length === 0) {
    return <p className="p-5 text-sm text-muted">{empty}</p>;
  }
  return (
    <ul className="divide-y divide-ui p-5">
      {uris.map((uri) => (
        <li key={uri} className="flex items-center justify-between gap-2 py-2 font-mono text-xs">
          <span className="break-all">{uri}</span>
          <CopyValue value={uri} />
        </li>
      ))}
    </ul>
  );
}
