import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { leads, waConversations } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all leads first
    const allLeads = await db
      .select()
      .from(leads)
      .where(eq(leads.profileId, user.profileId))
      .orderBy(desc(leads.createdAt));

    // Get the most recent conversation per lead (avoid duplicates from LEFT JOIN)
    const conversations = await db
      .select({
        leadId: waConversations.leadId,
        id: waConversations.id,
        active: waConversations.active,
        stage: waConversations.stage,
      })
      .from(waConversations)
      .where(
        sql`${waConversations.leadId} IS NOT NULL`
      )
      .orderBy(desc(waConversations.updatedAt));

    // Build a map of leadId → most recent conversation (first one wins since ordered by updatedAt DESC)
    const convMap = new Map<string, { id: string; active: boolean; stage: string }>();
    for (const conv of conversations) {
      if (conv.leadId && !convMap.has(conv.leadId)) {
        convMap.set(conv.leadId, { id: conv.id, active: conv.active, stage: conv.stage });
      }
    }

    // Merge leads with their most recent conversation
    const enrichedLeads = allLeads.map((lead) => {
      const conv = convMap.get(lead.id);
      return {
        ...lead,
        waConversationId: conv?.id ?? null,
        waAgentActive: conv?.active ?? null,
        waStage: conv?.stage ?? null,
      };
    });

    return NextResponse.json({ success: true, leads: enrichedLeads });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
