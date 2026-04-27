import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, leadMagnets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

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
      })
      .returning();

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
