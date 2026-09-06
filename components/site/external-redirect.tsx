"use client";

import { useEffect } from "react";

/** Immediately sends the browser to an external URL (bulletproof + instant). */
export function ExternalRedirect({ url }: { url: string }) {
  useEffect(() => {
    window.location.replace(url);
  }, [url]);
  return null;
}
