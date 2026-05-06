import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { funnels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
 * Performs weighted random A/B split and redirects to the selected variant.
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

    return NextResponse.redirect(new URL(selected.path, origin));
  } catch (error) {
    console.error("Funnel redirect error:", error);
    return NextResponse.redirect(new URL("/", origin));
  }
}
