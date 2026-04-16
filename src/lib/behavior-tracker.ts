"use client";

/**
 * Behavior Tracker — Silently tracks visitor behavior for lead scoring.
 * Sends batched events via navigator.sendBeacon for reliability.
 */

type BehaviorEvent = {
  type: "scroll" | "time" | "hover_product" | "form_focus" | "click_link" | "click_product";
  value: string | number;
  ts: number;
};

const BATCH_INTERVAL = 10_000; // 10 seconds
const STORAGE_KEY = "lp_behavior_events";
const SCORE_KEY = "lp_lead_score";

let events: BehaviorEvent[] = [];
let initialized = false;
let scrollMilestones = new Set<number>();
let startTime = 0;
let batchTimer: ReturnType<typeof setInterval> | null = null;

function pushEvent(event: Omit<BehaviorEvent, "ts">) {
  events.push({ ...event, ts: Date.now() });
}

function flushEvents() {
  if (events.length === 0) return;

  const payload = {
    events: [...events],
    sessionId: sessionStorage.getItem("lp_session_id") || "",
    url: window.location.pathname,
  };

  events = [];

  // Use sendBeacon for reliability (works even on page close)
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/track/behavior",
      new Blob([JSON.stringify(payload)], { type: "application/json" })
    );
  } else {
    fetch("/api/track/behavior", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }
}

function trackScroll() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (docHeight <= 0) return;

  const pct = Math.round((scrollTop / docHeight) * 100);

  // Track milestones: 25%, 50%, 75%, 100%
  for (const milestone of [25, 50, 75, 100]) {
    if (pct >= milestone && !scrollMilestones.has(milestone)) {
      scrollMilestones.add(milestone);
      pushEvent({ type: "scroll", value: milestone });
    }
  }
}

function trackTime() {
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  pushEvent({ type: "time", value: elapsed });
}

function setupProductHoverTracking() {
  // Watch for sustained hover on product cards
  const observer = new MutationObserver(() => {
    const productCards = document.querySelectorAll("[data-product-id]");
    productCards.forEach((card) => {
      if (card.getAttribute("data-hover-tracked")) return;
      card.setAttribute("data-hover-tracked", "1");

      let hoverTimer: ReturnType<typeof setTimeout> | null = null;

      card.addEventListener("mouseenter", () => {
        hoverTimer = setTimeout(() => {
          const productId = card.getAttribute("data-product-id") || "unknown";
          pushEvent({ type: "hover_product", value: productId });
        }, 2000); // 2 seconds sustained hover
      });

      card.addEventListener("mouseleave", () => {
        if (hoverTimer) clearTimeout(hoverTimer);
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function setupFormTracking() {
  // Track when user focuses on form fields (lead gen form)
  document.addEventListener("focusin", (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
      const form = target.closest("form");
      if (form) {
        pushEvent({ type: "form_focus", value: target.getAttribute("name") || "field" });
      }
    }
  }, { passive: true });
}

/**
 * Calculate a local lead score (0-100) from tracked events
 */
export function getLeadScore(): number {
  const allEvents = events;
  let score = 0;

  // Scroll depth
  if (scrollMilestones.has(75)) score += 20;
  else if (scrollMilestones.has(50)) score += 10;

  // Time on page
  const elapsed = (Date.now() - startTime) / 1000;
  if (elapsed > 120) score += 15;
  else if (elapsed > 60) score += 8;

  // Product interactions
  const productHovers = allEvents.filter((e) => e.type === "hover_product").length;
  score += Math.min(productHovers * 10, 25);

  // Form interaction
  const formFocuses = allEvents.filter((e) => e.type === "form_focus").length;
  if (formFocuses > 0) score += 30;

  // Returning visitor bonus
  const visitCount = parseInt(localStorage.getItem("lp_visit_count") || "1", 10);
  if (visitCount > 1) score += 10;

  return Math.min(score, 100);
}

/**
 * Get scroll speed (pixels per second over last measurement)
 */
let lastScrollY = 0;
let lastScrollTime = 0;
let currentScrollSpeed = 0;

export function getScrollSpeed(): number {
  return currentScrollSpeed;
}

function measureScrollSpeed() {
  const now = Date.now();
  const deltaY = Math.abs(window.scrollY - lastScrollY);
  const deltaT = (now - lastScrollTime) / 1000;

  if (deltaT > 0) {
    currentScrollSpeed = deltaY / deltaT;
  }

  lastScrollY = window.scrollY;
  lastScrollTime = now;
}

/**
 * Initialize the behavior tracker. Call once on mount.
 */
export function initBehaviorTracker() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  startTime = Date.now();
  lastScrollTime = Date.now();
  lastScrollY = window.scrollY;

  // Scroll tracking
  window.addEventListener("scroll", trackScroll, { passive: true });
  window.addEventListener("scroll", measureScrollSpeed, { passive: true });

  // Product hover tracking
  setupProductHoverTracking();

  // Form focus tracking
  setupFormTracking();

  // Periodic time tracking + batch flush
  batchTimer = setInterval(() => {
    trackTime();
    flushEvents();
  }, BATCH_INTERVAL);

  // Flush on page unload
  window.addEventListener("beforeunload", () => {
    trackTime();
    flushEvents();
  });

  // Flush on visibility change (tab switch)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      trackTime();
      flushEvents();
    }
  });
}

/**
 * Cleanup (for component unmount)
 */
export function destroyBehaviorTracker() {
  if (batchTimer) clearInterval(batchTimer);
  window.removeEventListener("scroll", trackScroll);
  window.removeEventListener("scroll", measureScrollSpeed);
  initialized = false;
}
