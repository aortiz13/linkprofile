import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leadMagnets, profiles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

// GET — List all lead magnets
export async function GET() {
  try {
    const [profile] = await db.select({ id: profiles.id }).from(profiles).limit(1);
    if (!profile) {
      return NextResponse.json({ success: true, leadMagnets: [] });
    }

    const items = await db
      .select()
      .from(leadMagnets)
      .where(eq(leadMagnets.profileId, profile.id))
      .orderBy(desc(leadMagnets.createdAt));

    return NextResponse.json({ success: true, leadMagnets: items });
  } catch (error) {
    console.error("Error fetching lead magnets:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST — Create a new lead magnet
const createSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional().or(z.literal("")),
  buttonText: z.string().max(100).optional().or(z.literal("")),
  resourceUrl: z.string().url("URL inválida"),
  coverImage: z.string().optional().or(z.literal("")),
  showName: z.boolean().optional(),
  showEmail: z.boolean().optional(),
  showWhatsapp: z.boolean().optional(),
  showOccupation: z.boolean().optional(),
  occupationOptions: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Datos inválidos" },
        { status: 400 }
      );
    }

    const [profile] = await db.select({ id: profiles.id }).from(profiles).limit(1);
    if (!profile) {
      return NextResponse.json({ error: "No hay perfil configurado" }, { status: 404 });
    }

    const {
      slug,
      title,
      description,
      buttonText,
      resourceUrl,
      coverImage,
      showName,
      showEmail,
      showWhatsapp,
      showOccupation,
      occupationOptions,
    } = parsed.data;

    // Check slug uniqueness
    const existing = await db
      .select({ id: leadMagnets.id })
      .from(leadMagnets)
      .where(eq(leadMagnets.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Este slug ya está en uso" },
        { status: 409 }
      );
    }

    const [newMagnet] = await db
      .insert(leadMagnets)
      .values({
        profileId: profile.id,
        slug,
        title,
        description: description || null,
        buttonText: buttonText || "Obtener recurso gratis",
        resourceUrl,
        coverImage: coverImage || null,
        showName: showName ?? true,
        showEmail: showEmail ?? true,
        showWhatsapp: showWhatsapp ?? true,
        showOccupation: showOccupation ?? true,
        occupationOptions: occupationOptions || [
          "Emprendedor",
          "Empresario",
          "Freelancer",
          "Empleado",
          "Estudiante",
          "Otro",
        ],
      })
      .returning();

    return NextResponse.json({ success: true, leadMagnet: newMagnet }, { status: 201 });
  } catch (error) {
    console.error("Error creating lead magnet:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
