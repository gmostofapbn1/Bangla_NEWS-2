"use client";

import { useEffect, useRef } from "react";

/** Fires a non-blocking blog view count once on mount — never delays render. */
export function PostClickBeacon({ id }: { id: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    fetch(`/api/post-click/${id}`, { method: "POST", keepalive: true }).catch(
      () => {},
    );
  }, [id]);
  return null;
}
