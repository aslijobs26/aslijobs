"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/services/api-client";

/**
 * Fetches private media via authenticated API and returns a blob object URL.
 * Revokes the object URL on unmount / URL change.
 */
export function useAuthenticatedMediaUrl(
  apiPath: string | null | undefined,
): { url: string; isLoading: boolean; error: string | null } {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";

    async function load() {
      if (!apiPath?.trim()) {
        setUrl("");
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const path = apiPath.startsWith("/api/v1/")
          ? apiPath.slice("/api/v1".length)
          : apiPath;
        const response = await apiClient.get<Blob>(path, {
          responseType: "blob",
          // Default apiClient JSON content-type must not ride on binary GETs.
          headers: { "Content-Type": undefined },
        });
        if (cancelled) {
          return;
        }

        const contentType = String(
          response.headers["content-type"] ?? "",
        ).toLowerCase();
        if (
          contentType.includes("application/json") ||
          contentType.includes("text/html")
        ) {
          throw new Error("Unexpected non-media response");
        }

        objectUrl = URL.createObjectURL(response.data);
        setUrl(objectUrl);
      } catch {
        if (!cancelled) {
          setUrl("");
          setError("Unable to load file.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [apiPath]);

  return { url, isLoading, error };
}
