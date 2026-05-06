import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { funnelEvents } from "@/lib/db/schema";
import { and, eq, gte } from "drizzle-orm";
import { createHash, randomUUID } from "crypto";
import { isBot } from "@/lib/bot-filter";
import { getGeo } from "@/lib/geo";
import {
  FunnelAttribution,
  readAttribution,
  setAttributionCookie,
} from "@/lib/funnel-attribution";

/**
 * Logs a `view` event when a visitor lands on a variant page (`/w/a1`, `/w/a2`, ...).
 * Reuses the attribution cookie set by `/api/funnel/[slug]` when present; for
 * direct visits (no cookie) it bootstraps a fresh sessionId so the visitor can
 * still be attributed to a sale later.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { funnelSlug, variantKey } = body as {
      funnelSlug?: string;
      variantKey?: string;
    };
    if (!funnelSlug || !variantKey) {
      return new NextResponse(null, { status: 400 });
    }

    const userAgent = req.headers.get("user-agent") || "";
    if (isBot(userAgent)) {
      return new NextResponse(null, { status: 204 });
    }

    const existing = readAttribution(req);
    // If the visitor came in via /api/funnel/[slug], honor that attribution.
    // Direct visitors get a fresh sessionId tied to whatever variant they landed on.
    const sessionId = existing?.sessionId ?? randomUUID();

    // Dedupe: same session viewing the same variant within 30 min counts once
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
    const dupe = await db.query.funnelEvents.findFirst({
      where: and(
        eq(funnelEvents.sessionId, sessionId),
        eq(funnelEvents.eventType, "view"),
        eq(funnelEvents.funnelSlug, funnelSlug),
        eq(funnelEvents.variantKey, variantKey),
        gte(funnelEvents.timestamp, thirtyMinAgo)
      ),
    });

    const response = new NextResponse(null, { status: 204 });

    // Always refresh the attribution cookie — gives direct visitors a sessionId
    // so their later sale can be tied back to this view.
    const attr: FunnelAttribution = {
      slug: funnelSlug,
      variant: variantKey,
      sessionId,
      ts: existing?.ts ?? Date.now(),
    };
    setAttributionCookie(response, attr);

    if (dupe) return response;

    const forwarded = req.headers.get("x-forwarded-for");
    const rawIp = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
    const hashedIp = rawIp ? createHash("sha256").update(rawIp).digest("hex").slice(0, 16) : null;
    const geo = await getGeo(rawIp);

    await db.insert(funnelEvents).values({
      eventType: "view",
      funnelSlug,
      variantKey,
      sessionId,
      ip: hashedIp,
      country: geo.country ?? null,
      metadata: {
        referrer: req.headers.get("referer"),
        directVisit: !existing,
      },
    });

    return response;
  } catch (error) {
    console.error("POST /api/funnel/track error:", error);
    return new NextResponse(null, { status: 204 });
  }
}
