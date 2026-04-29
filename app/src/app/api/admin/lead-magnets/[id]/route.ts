import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leadMagnets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET — Get a single lead magnet
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const [magnet] = await db
      .select()
      .from(leadMagnets)
      .where(eq(leadMagnets.id, id))
      .limit(1);

    if (!magnet) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, leadMagnet: magnet });
  } catch (error) {
    console.error("Error fetching lead magnet:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH — Update a lead magnet
const updateSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones")
    .optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional().nullable(),
  buttonText: z.string().max(100).optional(),
  resourceUrl: z.string().url("URL inválida").optional(),
  coverImage: z.string().optional().nullable(),
  showName: z.boolean().optional(),
  showEmail: z.boolean().optional(),
  showWhatsapp: z.boolean().optional(),
  showOccupation: z.boolean().optional(),
  occupationOptions: z.array(z.string()).optional(),
  active: z.boolean().optional(),
  whatsappEnabled: z.boolean().optional(),
  whatsappMessage: z.string().max(2000).optional().nullable(),
  whatsappDelay: z.number().int().min(0).max(900).optional(),
});

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Datos inválidos" },
        { status: 400 }
      );
    }

    // Check slug uniqueness if changing
    if (parsed.data.slug) {
      const existing = await db
        .select({ id: leadMagnets.id })
        .from(leadMagnets)
        .where(eq(leadMagnets.slug, parsed.data.slug))
        .limit(1);

      if (existing.length > 0 && existing[0].id !== id) {
        return NextResponse.json(
          { error: "Este slug ya está en uso" },
          { status: 409 }
        );
      }
    }

    const [updated] = await db
      .update(leadMagnets)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(leadMagnets.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, leadMagnet: updated });
  } catch (error) {
    console.error("Error updating lead magnet:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE — Delete a lead magnet
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const [deleted] = await db
      .delete(leadMagnets)
      .where(eq(leadMagnets.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lead magnet:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
