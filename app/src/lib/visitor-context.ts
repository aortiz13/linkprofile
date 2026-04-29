"use client";

import { useState, useEffect } from "react";

export interface VisitorContext {
  // Geo
  country: string | null;
  countryName: string | null;
  city: string | null;
  // Time
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  hour: number;
  // Referrer
  referrerSource: string | null; // "instagram" | "google" | "tiktok" | "facebook" | "twitter" | "whatsapp" | "direct" | "unknown"
  referrerRaw: string | null;
  // Device
  isMobile: boolean;
  // Returning
  isReturning: boolean;
  visitCount: number;
  // Weather
  weather: {
    condition: string | null; // "clear" | "clouds" | "rain" | "snow" | "thunderstorm" | "mist" | "drizzle"
    temp: number | null;
    icon: string | null;
    description: string | null;
  };
  // Status
  ready: boolean;
}

const CACHE_KEY = "lp_visitor_ctx";
const VISIT_COUNT_KEY = "lp_visit_count";

function getTimeOfDay(hour: number): VisitorContext["timeOfDay"] {
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 22) return "evening";
  return "night";
}

function parseReferrer(ref: string | null): string | null {
  if (!ref) return "direct";
  const r = ref.toLowerCase();
  if (r.includes("instagram.com") || r.includes("l.instagram.com")) return "instagram";
  if (r.includes("google.com") || r.includes("google.co")) return "google";
  if (r.includes("tiktok.com")) return "tiktok";
  if (r.includes("facebook.com") || r.includes("fb.com") || r.includes("l.facebook.com")) return "facebook";
  if (r.includes("twitter.com") || r.includes("x.com") || r.includes("t.co")) return "twitter";
  if (r.includes("wa.me") || r.includes("whatsapp")) return "whatsapp";
  if (r.includes("youtube.com") || r.includes("youtu.be")) return "youtube";
  if (r.includes("linkedin.com")) return "linkedin";
  return "unknown";
}

function detectMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

const REFERRER_LABELS: Record<string, string> = {
  instagram: "Instagram",
  google: "Google",
  tiktok: "TikTok",
  facebook: "Facebook",
  twitter: "X (Twitter)",
  whatsapp: "WhatsApp",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  direct: null as unknown as string,
  unknown: null as unknown as string,
};

export function getReferrerLabel(source: string | null): string | null {
  if (!source) return null;
  return REFERRER_LABELS[source] || null;
}

const TIME_GREETINGS: Record<VisitorContext["timeOfDay"], string> = {
  morning: "Buenos días",
  afternoon: "Buenas tardes",
  evening: "Buenas noches",
  night: "Buenas noches",
};

export function getTimeGreeting(timeOfDay: VisitorContext["timeOfDay"]): string {
  return TIME_GREETINGS[timeOfDay];
}

const COUNTRY_FLAGS: Record<string, string> = {
  AR: "🇦🇷", BO: "🇧🇴", BR: "🇧🇷", CL: "🇨🇱", CO: "🇨🇴",
  CR: "🇨🇷", DO: "🇩🇴", EC: "🇪🇨", SV: "🇸🇻", ES: "🇪🇸",
  US: "🇺🇸", GT: "🇬🇹", HN: "🇭🇳", MX: "🇲🇽", NI: "🇳🇮",
  PA: "🇵🇦", PY: "🇵🇾", PE: "🇵🇪", UY: "🇺🇾", VE: "🇻🇪",
  GB: "🇬🇧", FR: "🇫🇷", DE: "🇩🇪", IT: "🇮🇹", PT: "🇵🇹",
  CA: "🇨🇦", AU: "🇦🇺", JP: "🇯🇵", KR: "🇰🇷", IN: "🇮🇳",
};

export function getCountryFlag(code: string | null): string {
  if (!code) return "🌎";
  return COUNTRY_FLAGS[code] || "🌎";
}

export function useVisitorContext(): VisitorContext {
  const [ctx, setCtx] = useState<VisitorContext>({
    country: null, countryName: null, city: null,
    timeOfDay: "afternoon", hour: 12,
    referrerSource: null, referrerRaw: null,
    isMobile: false, isReturning: false, visitCount: 1,
    weather: { condition: null, temp: null, icon: null, description: null },
    ready: false,
  });

  useEffect(() => {
    // Check cache first — only reuse if it has weather data (v2 format)
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.weather?.condition) {
          setCtx({ ...parsed, ready: true });
          return;
        }
        // Old cache without weather — clear and re-fetch
        sessionStorage.removeItem(CACHE_KEY);
      } catch { /* proceed to fetch */ }
    }

    // Visit count (persists across sessions via localStorage)
    const prevCount = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || "0", 10);
    const visitCount = prevCount + 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(visitCount));

    // Immediate context (no API needed)
    const now = new Date();
    const hour = now.getHours();
    const base: Partial<VisitorContext> = {
      timeOfDay: getTimeOfDay(hour),
      hour,
      referrerSource: parseReferrer(document.referrer || null),
      referrerRaw: document.referrer || null,
      isMobile: detectMobile(),
      isReturning: visitCount > 1,
      visitCount,
    };

    // Fetch geo (bypass browser cache to get lat/lon)
    Promise.all([
      fetch("/api/public/geo", { cache: "no-cache" }).then(r => r.json()).catch(() => ({ country: null, countryName: null, city: null, lat: null, lon: null })),
    ]).then(async ([geo]) => {
      // Fetch weather based on lat/lon from geo (Open-Meteo, free)
      let weather: VisitorContext["weather"] = { condition: null, temp: null, icon: null, description: null };
      if (geo.lat && geo.lon) {
        try {
          const wRes = await fetch(`/api/public/weather?lat=${geo.lat}&lon=${geo.lon}`);
          if (wRes.ok) {
            weather = await wRes.json();
          }
        } catch { /* weather is optional */ }
      }

      const fullCtx: VisitorContext = {
        country: geo.country,
        countryName: geo.countryName,
        city: geo.city,
        timeOfDay: base.timeOfDay!,
        hour: base.hour!,
        referrerSource: base.referrerSource!,
        referrerRaw: base.referrerRaw!,
        isMobile: base.isMobile!,
        isReturning: base.isReturning!,
        visitCount: base.visitCount!,
        weather,
        ready: true,
      };

      // Cache for the session
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(fullCtx));
      setCtx(fullCtx);
    });
  }, []);

  return ctx;
}
