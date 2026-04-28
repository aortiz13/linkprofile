import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { linkClicks } from "@/lib/db/schema";
import { isBot } from "@/lib/bot-filter";
import { getGeo } from "@/lib/geo";
import { UAParser } from "ua-parser-js";
import { createHash } from "crypto";
import { handleLinkClick } from "@/lib/whatsapp-agent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { linkId, sessionId, url, itemTitle, blockType, profileId, referrer: clientReferrer, utmSource } = body;

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

    // Build effective referrer — same logic as visit tracking
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
    let effectiveReferrer = clientReferrer || null;

    if (!effectiveReferrer && utmSource) {
      effectiveReferrer =
        UTM_SOURCE_MAP[utmSource.toLowerCase()] || utmSource;
    }
    if (!effectiveReferrer && serverReferer) {
      try {
        const refUrl = new URL(serverReferer);
        const host = refUrl.hostname.replace("www.", "");
        if (!host.includes("localhost")) {
          effectiveReferrer = serverReferer;
        }
      } catch {
        // Invalid URL, skip
      }
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
      referrer: effectiveReferrer,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("POST /api/track/click error:", error);
    return new NextResponse(null, { status: 204 });
  }
}

// ─── GET: WhatsApp Agent Link Tracking ───────────────────────────────────────
// Receives ?t=TOKEN, logs the click, starts follow-up timer, redirects to target
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("t");

  if (!token) {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 });
  }

  try {
    const targetUrl = await handleLinkClick(token);

    if (!targetUrl) {
      // Invalid token — redirect to asesorias anyway
      return NextResponse.redirect("https://adrian-ortiz.com/asesorias");
    }

    return NextResponse.redirect(targetUrl);
  } catch (error) {
    console.error("GET /api/track/click error:", error);
    return NextResponse.redirect("https://adrian-ortiz.com/asesorias");
  }
}
