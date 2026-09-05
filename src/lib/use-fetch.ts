"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useFetch<T>(url: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(!!url);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const refetch = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) {
        const text = await r.text();
        throw new Error(text || `Request failed (${r.status})`);
      }
      const json = await r.json();
      if (mountedRef.current) setData(json as T);
    } catch (e) {
      if (mountedRef.current) setError(e instanceof Error ? e.message : "Error");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/use-memo
  }, [url, ...deps]);

  useEffect(() => {
    mountedRef.current = true;
    refetch();
    return () => {
      mountedRef.current = false;
    };
  }, [refetch]);

  return { data, loading, error, refetch, setData };
}
