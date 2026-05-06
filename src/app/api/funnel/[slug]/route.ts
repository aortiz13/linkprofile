import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { funnels, funnelEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createHash, randomUUID } from "crypto";
import { isBot } from "@/lib/bot-filter";
import { getGeo } from "@/lib/geo";
import {
  FunnelAttribution,
  readAttribution,
  setAttributionCookie,
} from "@/lib/funnel-attribution";

interface Variant {
  key: string;
  label: string;
  path: string;
  weight: number;
}

// Resolve the public origin behind a reverse proxy (Easypanel/Coolify/etc.).
// `req.url` reflects the internal container URL (e.g. http://localhost:80),
// which would leak into the redirect's Location header.
function getPublicOrigin(req: NextRequest): string {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto");
  if (forwardedHost) {
    return `${forwardedProto ?? "https"}://${forwardedHost}`;
  }
  const host = req.headers.get("host");
  if (host && !host.startsWith("localhost") && !host.startsWith("127.")) {
    return `${forwardedProto ?? "https"}://${host}`;
  }
  return "https://adrian-ortiz.com";
}

/**
 * Public redirect endpoint: /api/funnel/[slug]
 * Performs weighted random A/B split, logs the click, sets the attribution
 * cookie, and redirects to the chosen variant.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const origin = getPublicOrigin(req);
  try {
    const { slug } = await params;
    const [funnel] = await db
      .select()
      .from(funnels)
      .where(eq(funnels.slug, slug))
      .limit(1);

    if (!funnel || !funnel.active) {
      return NextResponse.redirect(new URL("/", origin));
    }

    const variants = funnel.variants as Variant[];
    if (!variants || variants.length === 0) {
      return NextResponse.redirect(new URL("/", origin));
    }

    // Weighted random selection
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;
    let selected = variants[0];

    for (const variant of variants) {
      random -= variant.weight;
      if (random <= 0) {
        selected = variant;
        break;
      }
    }

    const response = NextResponse.redirect(new URL(selected.path, origin));

    // ─── Tracking ────────────────────────────────────────────────────────────
    const userAgent = req.headers.get("user-agent") || "";
    if (!isBot(userAgent)) {
      const existing = readAttribution(req);
      // Reuse sessionId if the visitor already has one — keeps the funnel
      // chain (click → view → sale) tied together across re-rolls.
      const sessionId = existing?.sessionId ?? randomUUID();

      const attr: FunnelAttribution = {
        slug,
        variant: selected.key,
        sessionId,
        ts: Date.now(),
      };
      setAttributionCookie(response, attr);

      // Fire-and-forget the event insert. We don't await — redirects must
      // happen fast and tracking is best-effort.
      void recordClickEvent(req, attr);
    }

    return response;
  } catch (error) {
    console.error("Funnel redirect error:", error);
    return NextResponse.redirect(new URL("/", origin));
  }
}

async function recordClickEvent(req: NextRequest, attr: FunnelAttribution) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const rawIp = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
    const hashedIp = rawIp ? createHash("sha256").update(rawIp).digest("hex").slice(0, 16) : null;
    const geo = await getGeo(rawIp);

    await db.insert(funnelEvents).values({
      eventType: "click",
      funnelSlug: attr.slug,
      variantKey: attr.variant,
      sessionId: attr.sessionId,
      ip: hashedIp,
      country: geo.country ?? null,
      metadata: {
        referrer: req.headers.get("referer"),
      },
    });
  } catch (err) {
    console.error("[funnel] click insert failed:", err);
  }
}
