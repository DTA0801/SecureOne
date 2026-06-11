"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CopyValue } from "@/components/ui/CopyValue";

export function LiveApiResponse({
  url,
  disabled,
  disabledHint,
}: {
  url: string;
  disabled?: boolean;
  disabledHint?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ status: number; body: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchLive() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const text = await res.text();
      let body = text;
      try {
        body = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        /* keep raw text */
      }
      setResult({ status: res.status, body });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={fetchLive}
          disabled={disabled || loading}
        >
          {loading ? "Fetching…" : "Fetch live response"}
        </Button>
        {disabled && disabledHint && <p className="text-xs text-muted">{disabledHint}</p>}
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {result && (
        <div className="rounded-lg border border-ui bg-black/5 dark:bg-white/5">
          <div className="flex items-center justify-between gap-2 border-b border-ui px-3 py-2">
            <span className="font-mono text-xs text-ui">
              HTTP {result.status}
              {result.status === 404 && (
                <span className="ml-2 text-muted">— enable Public API or check settings</span>
              )}
            </span>
            <CopyValue value={result.body} />
          </div>
          <pre className="max-h-80 overflow-auto p-3 font-mono text-[11px] leading-relaxed text-ui">
            {result.body}
          </pre>
        </div>
      )}
    </div>
  );
}
