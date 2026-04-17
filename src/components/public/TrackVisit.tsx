"use client";

import { useEffect } from "react";
import { initBehaviorTracker, destroyBehaviorTracker } from "@/lib/behavior-tracker";

/**
 * Fires a single page view tracking event on mount.
 * Also initializes the behavior tracker for predictive lead scoring.
 * Uses sessionStorage to avoid re-firing on the same page load.
 */
export function TrackVisit() {
  useEffect(() => {
    const key = "lp_tracked";
    // In development allow tracking on every refresh to test easily
    if (process.env.NODE_ENV !== "development" && sessionStorage.getItem(key)) {
      // Still init behavior tracker even if visit was already tracked
      initBehaviorTracker();
      return () => destroyBehaviorTracker();
    }

    const sessionId =
      sessionStorage.getItem("lp_session_id") || crypto.randomUUID();
    sessionStorage.setItem("lp_session_id", sessionId);

    // Extract UTM params — TikTok/Instagram strip document.referrer in
    // their in-app browsers, so utm_source is the reliable fallback.
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get("utm_source") || null;
    const utmMedium = params.get("utm_medium") || null;
    const utmCampaign = params.get("utm_campaign") || null;

    fetch("/api/track/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        referrer: document.referrer || null,
        utmSource,
        utmMedium,
        utmCampaign,
      }),
    })
      .then(() => sessionStorage.setItem(key, "1"))
      .catch(() => {}); // Never fail visibly

    // Initialize behavior tracker for lead scoring
    initBehaviorTracker();

    return () => destroyBehaviorTracker();
  }, []);

  return null;
}
