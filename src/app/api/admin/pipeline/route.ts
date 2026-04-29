import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { leads, waConversations, waMessages } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const VALID_STAGES = [
  "lead",
  "nutrido_bot",
  "asesor_humano",
  "reunion_agendada",
  "seguimiento",
  "cierre_ganado",
  "cierre_perdido",
];

// PATCH — Move a lead to a different funnel stage
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leadId, stage } = await req.json();

    if (!leadId || !VALID_STAGES.includes(stage)) {
      return NextResponse.json({ error: "Invalid leadId or stage" }, { status: 400 });
    }

    await db
      .update(leads)
      .set({ funnelStage: stage })
      .where(eq(leads.id, leadId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating funnel stage:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET — Get lead detail with bot conversation summary
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const leadId = req.nextUrl.searchParams.get("leadId");
    if (!leadId) {
      return NextResponse.json({ error: "leadId required" }, { status: 400 });
    }

    // Get the lead
    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Get conversation
    const [conv] = await db
      .select()
      .from(waConversations)
      .where(eq(waConversations.leadId, leadId))
      .orderBy(desc(waConversations.updatedAt))
      .limit(1);

    let summary = null;
    let messages: { role: string; content: string; createdAt: Date }[] = [];

    if (conv) {
      // Get all messages
      messages = await db
        .select({
          role: waMessages.role,
          content: waMessages.content,
          createdAt: waMessages.createdAt,
        })
        .from(waMessages)
        .where(eq(waMessages.conversationId, conv.id))
        .orderBy(waMessages.createdAt);

      // Generate AI summary if there are at least 3 messages
      if (messages.length >= 3) {
        const transcript = messages
          .map((m) => `${m.role === "user" ? "Lead" : "Adrian (bot)"}:\n${m.content}`)
          .join("\n\n");

        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.3,
            messages: [
              {
                role: "system",
                content: `Sos un asistente que resume conversaciones de ventas para Adrian Ortiz.
Generá un resumen ejecutivo BREVE (máximo 5 bullets) con la información MÁS RELEVANTE para cerrar la venta.

Formato:
- 👤 **Nombre y ocupación**: ...
- 🎯 **Qué busca**: ...
- 💡 **Nivel de conocimiento en IA**: ...
- 🔥 **Nivel de interés** (frío/tibio/caliente): ...
- 📝 **Notas clave**: ... (cualquier dato relevante que haya mencionado)

Sé directo y conciso. Solo información útil para la venta.`,
              },
              {
                role: "user",
                content: `Resumí esta conversación:\n\n${transcript}`,
              },
            ],
          });

          summary = completion.choices[0]?.message?.content || null;
        } catch (err) {
          console.error("Error generating summary:", err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      lead,
      conversation: conv
        ? {
            id: conv.id,
            stage: conv.stage,
            active: conv.active,
            qualificationScore: conv.qualificationScore,
            qualificationData: conv.qualificationData,
            linkSent: conv.linkSent,
            linkClickedAt: conv.linkClickedAt,
            messageCount: messages.length,
          }
        : null,
      summary,
      messages: messages.slice(-20), // Last 20 messages
    });
  } catch (error) {
    console.error("Error fetching lead detail:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
