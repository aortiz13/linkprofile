import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  broadcastCampaigns,
  broadcastRecipients,
  leads,
} from "@/lib/db/schema";
import { eq, desc, and, isNotNull, inArray, gte, sql } from "drizzle-orm";
import {
  buildRecipientList,
  startCampaign,
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
  isCampaignActive,
  type BroadcastFilters,
  type RateConfig,
} from "@/lib/broadcast-engine";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const campaignId = req.nextUrl.searchParams.get("id");
    if (campaignId) {
      const [campaign] = await db.select().from(broadcastCampaigns).where(eq(broadcastCampaigns.id, campaignId)).limit(1);
      if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const recipients = await db.select().from(broadcastRecipients).where(eq(broadcastRecipients.campaignId, campaignId));
      return NextResponse.json({ success: true, campaign, recipients, isActive: isCampaignActive(campaignId) });
    }

    const campaigns = await db.select().from(broadcastCampaigns).where(eq(broadcastCampaigns.profileId, user.profileId)).orderBy(desc(broadcastCampaigns.createdAt));
    return NextResponse.json({ success: true, campaigns });
  } catch (error) {
    console.error("Error fetching broadcasts:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    if (action === "preview") {
      const filters = body.filters as BroadcastFilters;
      const audience = await buildRecipientList(user.profileId, filters);
      return NextResponse.json({
        success: true, count: audience.length,
        preview: audience.slice(0, 10).map((l) => ({ name: l.name, phone: l.phone, occupation: l.occupation, source: l.source })),
      });
    }

    if (action === "sources") {
      const sources = await db.select({ source: leads.source }).from(leads).where(and(eq(leads.profileId, user.profileId), isNotNull(leads.source))).groupBy(leads.source);
      return NextResponse.json({ success: true, sources: sources.map((s) => s.source).filter(Boolean) });
    }

    const { name, template, filters, rateConfig, launch } = body;
    if (!name || !template) return NextResponse.json({ error: "Name and template required" }, { status: 400 });

    const audienceFilters = (filters || {}) as BroadcastFilters;
    const rate = (rateConfig || { intervalMinMs: 15000, intervalMaxMs: 45000, pauseEveryN: 10, pauseDurationMs: 180000, maxPerSession: 60 }) as RateConfig;

    const audience = await buildRecipientList(user.profileId, audienceFilters);
    if (audience.length === 0) return NextResponse.json({ error: "No leads match the filters" }, { status: 400 });

    const [campaign] = await db.insert(broadcastCampaigns).values({
      profileId: user.profileId, name, template, filters: audienceFilters,
      status: launch ? "sending" : "draft", totalRecipients: audience.length, rateConfig: rate,
    }).returning();

    const recipientValues = audience.map((lead) => ({ campaignId: campaign.id, leadId: lead.id, phone: lead.phone, status: "pending" as const }));
    for (let i = 0; i < recipientValues.length; i += 100) {
      await db.insert(broadcastRecipients).values(recipientValues.slice(i, i + 100));
    }

    if (launch) { startCampaign(campaign.id).catch((err) => console.error("[Broadcast] Campaign error:", err)); }

    return NextResponse.json({ success: true, campaign, recipientCount: audience.length });
  } catch (error) {
    console.error("Error creating broadcast:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { campaignId, action } = await req.json();
    if (!campaignId || !action) return NextResponse.json({ error: "campaignId and action required" }, { status: 400 });

    const [campaign] = await db.select().from(broadcastCampaigns).where(and(eq(broadcastCampaigns.id, campaignId), eq(broadcastCampaigns.profileId, user.profileId))).limit(1);
    if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

    switch (action) {
      case "pause":
        pauseCampaign(campaignId);
        return NextResponse.json({ success: true, status: "paused" });
      case "resume":
        if (isCampaignActive(campaignId)) { resumeCampaign(campaignId); }
        else {
          await db.update(broadcastCampaigns).set({ status: "sending" }).where(eq(broadcastCampaigns.id, campaignId));
          startCampaign(campaignId).catch((err) => console.error("[Broadcast] Resume error:", err));
        }
        return NextResponse.json({ success: true, status: "sending" });
      case "cancel":
        if (isCampaignActive(campaignId)) { cancelCampaign(campaignId); }
        else { await db.update(broadcastCampaigns).set({ status: "cancelled", completedAt: new Date() }).where(eq(broadcastCampaigns.id, campaignId)); }
        return NextResponse.json({ success: true, status: "cancelled" });
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error updating broadcast:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
