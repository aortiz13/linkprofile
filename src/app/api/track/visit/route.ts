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
    const { sessionId, referrer } = body;

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
      referrer: referrer || null,
      userAgent: userAgent.slice(0, 500), // Limit stored UA length
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("POST /api/track/visit error:", error);
    // Never fail the response — tracking is non-critical
    return new NextResponse(null, { status: 204 });
  }
}
