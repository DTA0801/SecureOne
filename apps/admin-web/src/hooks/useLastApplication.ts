"use client";

import { useCallback, useState } from "react";

const STORAGE_KEY = "secureone_last_app";

function readStoredApplicationId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored || undefined;
  } catch {
    return undefined;
  }
}

export function useLastApplicationId() {
  const [lastApplicationId, setLastApplicationId] = useState<string | undefined>(
    readStoredApplicationId,
  );

  const rememberApplicationId = useCallback((applicationId: string) => {
    setLastApplicationId(applicationId);
    try {
      sessionStorage.setItem(STORAGE_KEY, applicationId);
    } catch {
      // ignore
    }
  }, []);

  return { lastApplicationId, rememberApplicationId };
}
