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

/**
 * Public redirect endpoint: /api/funnel/[slug]
 * Performs weighted random A/B split and redirects to the selected variant.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const [funnel] = await db
      .select()
      .from(funnels)
      .where(eq(funnels.slug, slug))
      .limit(1);

    if (!funnel || !funnel.active) {
      return NextResponse.redirect(new URL("/", _req.url));
    }

    const variants = funnel.variants as Variant[];
    if (!variants || variants.length === 0) {
      return NextResponse.redirect(new URL("/", _req.url));
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

    return NextResponse.redirect(new URL(selected.path, _req.url));
  } catch (error) {
    console.error("Funnel redirect error:", error);
    return NextResponse.redirect(new URL("/", _req.url));
  }
}
