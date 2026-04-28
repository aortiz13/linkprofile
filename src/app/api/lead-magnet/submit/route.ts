import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, leadMagnets, waConversations, waMessages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  sendWhatsAppMessage,
  interpolateMessage,
} from "@/lib/evolution-api";

const submitSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(1, "El WhatsApp es obligatorio"),
  occupation: z.string().min(1, "La ocupación es obligatoria"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = submitSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Datos inválidos" },
        { status: 400 }
      );
    }

    const { slug, name, email, phone, occupation } = parsed.data;

    // Find the lead magnet by slug
    const [magnet] = await db
      .select()
      .from(leadMagnets)
      .where(eq(leadMagnets.slug, slug))
      .limit(1);

    if (!magnet || !magnet.active) {
      return NextResponse.json(
        { error: "Lead magnet no encontrado" },
        { status: 404 }
      );
    }

    // Detect country from request headers
    const country =
      req.headers.get("cf-ipcountry") ||
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("x-country") ||
      null;

    // Determine initial WhatsApp status
    const shouldSendWhatsApp =
      magnet.whatsappEnabled && magnet.whatsappMessage && phone;

    // Save the lead
    const [newLead] = await db
      .insert(leads)
      .values({
        profileId: magnet.profileId,
        leadMagnetId: magnet.id,
        name,
        email,
        phone,
        occupation,
        source: `lead_magnet:${magnet.slug}`,
        country,
        whatsappStatus: shouldSendWhatsApp ? "pending" : null,
      })
      .returning();

    // Fire-and-forget WhatsApp sending (don't block the response)
    if (shouldSendWhatsApp && newLead) {
      const delayMs = (magnet.whatsappDelay || 0) * 1000;

      const sendFn = async () => {
        try {
          // Interpolate the message template with lead data
          const message = interpolateMessage(magnet.whatsappMessage!, {
            name,
            email,
            phone,
            occupation,
            resourceTitle: magnet.title,
          });

          const result = await sendWhatsAppMessage(phone, message);

          // Update lead with result
          await db
            .update(leads)
            .set({
              whatsappStatus: result.success ? "sent" : "error",
              whatsappError: result.error || null,
              whatsappSentAt: result.success ? new Date() : null,
            })
            .where(eq(leads.id, newLead.id));

          // If sent successfully, create conversation + store initial message in memory
          if (result.success) {
            try {
              const cleanPhone = phone.replace(/[^0-9]/g, "");
              const [conv] = await db
                .insert(waConversations)
                .values({
                  phone: cleanPhone,
                  leadId: newLead.id,
                  leadContext: {
                    name,
                    email,
                    phone,
                    occupation,
                    resourceTitle: magnet.title,
                  },
                  stage: "greeting",
                })
                .returning();

              // Store the initial automated message as assistant message
              await db.insert(waMessages).values({
                conversationId: conv.id,
                role: "assistant",
                content: message,
              });

              console.log(
                `[WA Agent] Initial message stored in memory for ${cleanPhone} (conv: ${conv.id})`
              );
            } catch (memErr) {
              console.error("Error storing initial message in memory:", memErr);
            }
          }
        } catch (err) {
          console.error("Error in WhatsApp send flow:", err);
          await db
            .update(leads)
            .set({
              whatsappStatus: "error",
              whatsappError:
                err instanceof Error ? err.message : "Error desconocido",
            })
            .where(eq(leads.id, newLead.id));
        }
      };

      if (delayMs > 0) {
        // Schedule the send after the delay
        setTimeout(sendFn, delayMs);
      } else {
        // Send immediately but don't await (fire-and-forget)
        sendFn();
      }
    }

    return NextResponse.json({
      success: true,
      lead: newLead,
      resourceUrl: magnet.resourceUrl,
    });
  } catch (error) {
    console.error("Error submitting lead magnet form:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
