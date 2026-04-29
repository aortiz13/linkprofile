import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { leads, waConversations } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allLeads = await db
      .select({
        id: leads.id,
        name: leads.name,
        email: leads.email,
        phone: leads.phone,
        occupation: leads.occupation,
        message: leads.message,
        source: leads.source,
        country: leads.country,
        whatsappStatus: leads.whatsappStatus,
        whatsappError: leads.whatsappError,
        whatsappSentAt: leads.whatsappSentAt,
        createdAt: leads.createdAt,
        // WA Agent fields from conversation
        waConversationId: waConversations.id,
        waAgentActive: waConversations.active,
        waStage: waConversations.stage,
      })
      .from(leads)
      .leftJoin(waConversations, eq(waConversations.leadId, leads.id))
      .where(eq(leads.profileId, user.profileId))
      .orderBy(desc(leads.createdAt));

    return NextResponse.json({ success: true, leads: allLeads });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
