"use client";

import { useEffect, useRef } from "react";

/** Fires a non-blocking click count once on mount — never delays render. */
export function ClickBeacon({ id }: { id: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    fetch(`/api/click/${id}`, { method: "POST", keepalive: true }).catch(() => {});
  }, [id]);
  return null;
}
