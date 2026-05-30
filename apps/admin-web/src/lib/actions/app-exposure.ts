"use server";

import {
  fetchAppExposure,
  fetchApplicationExposure,
  saveAppExposure,
  type AppSettingsExposure,
} from "@/lib/api/app-exposure";
import { ApiError } from "@/lib/api/client";
import { DEFAULT_APP_SETTINGS_EXPOSURE, resolveAppSettingsExposure } from "@/lib/settings-exposure";

function formatError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 404) {
      return "Auth server is missing settings API — restart apps/auth-server (./gradlew bootRun).";
    }
    return e.message;
  }
  if (e instanceof Error) return e.message;
  return "Request failed";
}

export async function loadAppExposureAction(): Promise<{
  exposure: AppSettingsExposure;
  error?: string;
}> {
  try {
    return { exposure: await fetchAppExposure() };
  } catch (e) {
    return { exposure: { ...DEFAULT_APP_SETTINGS_EXPOSURE }, error: formatError(e) };
  }
}

export async function saveAppExposureAction(
  body: AppSettingsExposure,
): Promise<{ exposure: AppSettingsExposure; error?: string }> {
  try {
    return { exposure: await saveAppExposure(body) };
  } catch (e) {
    return { exposure: body, error: formatError(e) };
  }
}

export async function loadApplicationExposureAction(applicationId: string): Promise<{
  exposure: AppSettingsExposure;
  error?: string;
}> {
  try {
    return { exposure: await fetchApplicationExposure(applicationId) };
  } catch (e) {
    return {
      exposure: resolveAppSettingsExposure(null),
      error: formatError(e),
    };
  }
}
