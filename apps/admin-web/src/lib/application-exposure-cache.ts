import type { AppSettingsExposure } from "@/lib/api/app-exposure";

type ExposureBundle = {
  exposure: AppSettingsExposure;
  error?: string;
  mfaTabEnabled: boolean;
  tokenTabEnabled: boolean;
};

const cache = new Map<string, ExposureBundle>();
const inflight = new Map<string, Promise<ExposureBundle>>();

export function getCachedApplicationExposure(applicationId: string): ExposureBundle | undefined {
  return cache.get(applicationId);
}

export async function loadApplicationExposureDeduped(
  applicationId: string,
  loader: () => Promise<ExposureBundle>,
): Promise<ExposureBundle> {
  const cached = cache.get(applicationId);
  if (cached) return cached;

  const pending = inflight.get(applicationId);
  if (pending) return pending;

  const promise = loader()
    .then((bundle) => {
      cache.set(applicationId, bundle);
      inflight.delete(applicationId);
      return bundle;
    })
    .catch((error) => {
      inflight.delete(applicationId);
      throw error;
    });

  inflight.set(applicationId, promise);
  return promise;
}

export function patchCachedApplicationExposure(
  applicationId: string,
  patch: Partial<Pick<ExposureBundle, "mfaTabEnabled" | "tokenTabEnabled">>,
): void {
  const current = cache.get(applicationId);
  if (!current) return;
  cache.set(applicationId, { ...current, ...patch });
}
