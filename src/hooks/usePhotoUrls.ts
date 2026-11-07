"use client";

import { useEffect, useState } from "react";
import { getPhotoUrls } from "@/lib/photos";

// Resolves storage paths to viewable (signed) URLs.
export function usePhotoUrls(paths: (string | null | undefined)[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = [...new Set(paths.filter(Boolean))].sort().join("|");

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    getPhotoUrls(key.split("|")).then((result) => {
      if (!cancelled) setUrls(result);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return urls;
}
