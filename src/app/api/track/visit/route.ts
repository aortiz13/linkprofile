import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pageViews } from "@/lib/db/schema";
import { isBot } from "@/lib/bot-filter";
import { getGeo } from "@/lib/geo";
import { UAParser } from "ua-parser-js";
import { createHash } from "crypto";
import { eq, and, gte } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, referrer, utmSource, utmMedium, utmCampaign } = body;

    if (!sessionId) {
      return new NextResponse(null, { status: 400 });
    }

    // Get visitor metadata from headers
    const userAgent = req.headers.get("user-agent") || "";
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;

    // Filter bots
    if (isBot(userAgent)) {
      return new NextResponse(null, { status: 204 });
    }

    // Deduplicate: same session within the last 30 minutes
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
    const existing = await db.query.pageViews.findFirst({
      where: and(
        eq(pageViews.sessionId, sessionId),
        gte(pageViews.timestamp, thirtyMinAgo)
      ),
    });

    if (existing) {
      return new NextResponse(null, { status: 204 });
    }

    // Parse user agent
    const ua = new UAParser(userAgent);
    const deviceType = ua.getDevice().type || "desktop"; // mobile | tablet | desktop
    const os = ua.getOS().name || "Unknown";
    const browser = ua.getBrowser().name || "Unknown";

    // Geolocation
    const geo = await getGeo(ip);

    // Hash IP for privacy
    const hashedIp = ip
      ? createHash("sha256").update(ip).digest("hex").slice(0, 16)
      : null;

    // Get first profile
    const profile = await db.query.profiles.findFirst();
    if (!profile) {
      return new NextResponse(null, { status: 204 });
    }

    // Build effective referrer — TikTok/Instagram in-app browsers often
    // strip document.referrer, so we fall back to utm_source and the
    // server-side Referer header.
    const UTM_SOURCE_MAP: Record<string, string> = {
      instagram: "https://instagram.com",
      tiktok: "https://tiktok.com",
      facebook: "https://facebook.com",
      twitter: "https://twitter.com",
      youtube: "https://youtube.com",
      linkedin: "https://linkedin.com",
      whatsapp: "https://whatsapp.com",
      google: "https://google.com",
      threads: "https://threads.net",
    };
    const serverReferer = req.headers.get("referer") || null;
    let effectiveReferrer = referrer || null;

    if (!effectiveReferrer && utmSource) {
      // Map known utm_source values to canonical URLs for consistent analytics
      effectiveReferrer =
        UTM_SOURCE_MAP[utmSource.toLowerCase()] || utmSource;
    }
    if (!effectiveReferrer && serverReferer) {
      // Use server-side Referer header as last resort (some in-app
      // browsers do send it even when JS document.referrer is empty)
      try {
        const refUrl = new URL(serverReferer);
        // Ignore self-referrals
        const host = refUrl.hostname.replace("www.", "");
        if (!host.includes("localhost")) {
          effectiveReferrer = serverReferer;
        }
      } catch {
        // Invalid URL, skip
      }
    }

    // Insert page view
    await db.insert(pageViews).values({
      profileId: profile.id,
      sessionId,
      ip: hashedIp,
      country: geo.country,
      countryName: geo.countryName,
      city: geo.city,
      device: deviceType === "mobile" ? "mobile" : deviceType === "tablet" ? "tablet" : "desktop",
      os,
      browser,
      referrer: effectiveReferrer,
      userAgent: userAgent.slice(0, 500), // Limit stored UA length
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("POST /api/track/visit error:", error);
    // Never fail the response — tracking is non-critical
    return new NextResponse(null, { status: 204 });
  }
}
