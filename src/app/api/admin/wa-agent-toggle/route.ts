import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { waConversations, leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PATCH /api/admin/wa-agent-toggle
// Body: { conversationId: string, active: boolean }
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId, active } = await req.json();

    if (!conversationId || typeof active !== "boolean") {
      return NextResponse.json({ error: "Missing conversationId or active" }, { status: 400 });
    }

    // Update conversation
    const [conv] = await db
      .update(waConversations)
      .set({
        active,
        optedOut: !active,
        stage: active ? "greeting" : "inactive",
        updatedAt: new Date(),
      })
      .where(eq(waConversations.id, conversationId))
      .returning({ leadId: waConversations.leadId });

    // Auto-move lead to "asesor_humano" when bot is deactivated
    if (!active && conv?.leadId) {
      await db
        .update(leads)
        .set({ funnelStage: "asesor_humano" })
        .where(eq(leads.id, conv.leadId));
    }

    console.log(`[Admin] Agent ${active ? "activated" : "deactivated"} for conversation ${conversationId}`);

    return NextResponse.json({ success: true, active });
  } catch (error) {
    console.error("Error toggling agent:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
