import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { funnelEvents } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export interface VariantMetrics {
  funnelSlug: string;
  variantKey: string;
  clicks: number;
  views: number;
  sales: number;
  revenueCents: number;
  currency: string | null;
}

/**
 * Aggregates funnel_events into per-variant counts and revenue.
 * Single grouped query — counts each event_type with conditional aggregation.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rows = await db
      .select({
        funnelSlug: funnelEvents.funnelSlug,
        variantKey: funnelEvents.variantKey,
        clicks: sql<number>`COUNT(*) FILTER (WHERE ${funnelEvents.eventType} = 'click')`,
        views: sql<number>`COUNT(*) FILTER (WHERE ${funnelEvents.eventType} = 'view')`,
        sales: sql<number>`COUNT(*) FILTER (WHERE ${funnelEvents.eventType} = 'sale')`,
        revenueCents: sql<number>`COALESCE(SUM(${funnelEvents.amountCents}) FILTER (WHERE ${funnelEvents.eventType} = 'sale'), 0)`,
        currency: sql<string | null>`MAX(${funnelEvents.currency}) FILTER (WHERE ${funnelEvents.eventType} = 'sale')`,
      })
      .from(funnelEvents)
      .groupBy(funnelEvents.funnelSlug, funnelEvents.variantKey);

    const metrics: VariantMetrics[] = rows.map((r) => ({
      funnelSlug: r.funnelSlug,
      variantKey: r.variantKey,
      clicks: Number(r.clicks ?? 0),
      views: Number(r.views ?? 0),
      sales: Number(r.sales ?? 0),
      revenueCents: Number(r.revenueCents ?? 0),
      currency: r.currency,
    }));

    return NextResponse.json({ success: true, metrics });
  } catch (error) {
    console.error("Error fetching funnel metrics:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
