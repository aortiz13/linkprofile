"use client";

import { useEffect } from "react";

interface Props {
  funnelSlug: string;
  variantKey: string;
}

export default function FunnelViewTracker({ funnelSlug, variantKey }: Props) {
  useEffect(() => {
    const flagKey = `lp_funnel_view_${funnelSlug}_${variantKey}`;
    if (sessionStorage.getItem(flagKey)) return;
    sessionStorage.setItem(flagKey, "1");

    fetch("/api/funnel/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ funnelSlug, variantKey }),
      keepalive: true,
    }).catch(() => {
      // Tracking is best-effort
    });
  }, [funnelSlug, variantKey]);

  return null;
}
