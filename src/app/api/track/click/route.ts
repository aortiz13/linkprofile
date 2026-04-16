import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { linkClicks } from "@/lib/db/schema";
import { isBot } from "@/lib/bot-filter";
import { getGeo } from "@/lib/geo";
import { UAParser } from "ua-parser-js";
import { createHash } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { linkId, sessionId, url, itemTitle, blockType, profileId } = body;

    if ((!linkId && !url) || !sessionId) {
      return new NextResponse(null, { status: 400 });
    }

    const userAgent = req.headers.get("user-agent") || "";
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;

    // Filter bots
    if (isBot(userAgent)) {
      return new NextResponse(null, { status: 204 });
    }

    // Parse UA
    const ua = new UAParser(userAgent);
    const deviceType = ua.getDevice().type || "desktop";
    const os = ua.getOS().name || "Unknown";
    const browser = ua.getBrowser().name || "Unknown";

    // Geo
    const geo = await getGeo(ip);

    // Hash IP
    const hashedIp = ip
      ? createHash("sha256").update(ip).digest("hex").slice(0, 16)
      : null;

    // Get profile
    let targetProfileId = profileId;
    if (!targetProfileId) {
      const profile = await db.query.profiles.findFirst();
      if (!profile) {
        return new NextResponse(null, { status: 204 });
      }
      targetProfileId = profile.id;
    }

    // Insert click
    await db.insert(linkClicks).values({
      linkId: linkId || null,
      url: url || null,
      itemTitle: itemTitle || null,
      blockType: blockType || null,
      profileId: targetProfileId,
      sessionId,
      ip: hashedIp,
      country: geo.country,
      device: deviceType === "mobile" ? "mobile" : deviceType === "tablet" ? "tablet" : "desktop",
      os,
      browser,
      referrer: req.headers.get("referer") || null,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("POST /api/track/click error:", error);
    return new NextResponse(null, { status: 204 });
  }
}
