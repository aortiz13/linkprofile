import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { waAudioSnippets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET: List all audio snippets
export async function GET() {
  try {
    const snippets = await db
      .select({
        id: waAudioSnippets.id,
        name: waAudioSnippets.name,
        triggerKey: waAudioSnippets.triggerKey,
        description: waAudioSnippets.description,
        audioDuration: waAudioSnippets.audioDuration,
        active: waAudioSnippets.active,
        createdAt: waAudioSnippets.createdAt,
        updatedAt: waAudioSnippets.updatedAt,
      })
      .from(waAudioSnippets)
      .orderBy(waAudioSnippets.createdAt);

    return NextResponse.json(snippets);
  } catch (error) {
    console.error("GET /api/admin/audio-snippets error:", error);
    return NextResponse.json({ error: "Error al obtener audios" }, { status: 500 });
  }
}

// POST: Create a new audio snippet
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, triggerKey, description, audioBase64, audioDuration } = body;

    if (!name || !triggerKey || !description || !audioBase64) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: name, triggerKey, description, audioBase64" },
        { status: 400 }
      );
    }

    // Check for duplicate trigger key
    const existing = await db
      .select()
      .from(waAudioSnippets)
      .where(eq(waAudioSnippets.triggerKey, triggerKey))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: `Ya existe un audio con el trigger "${triggerKey}"` },
        { status: 409 }
      );
    }

    const [snippet] = await db
      .insert(waAudioSnippets)
      .values({
        name,
        triggerKey,
        description,
        audioBase64,
        audioDuration: audioDuration || null,
      })
      .returning();

    return NextResponse.json(snippet, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/audio-snippets error:", error);
    return NextResponse.json({ error: "Error al crear audio" }, { status: 500 });
  }
}

// PATCH: Update an audio snippet
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const [updated] = await db
      .update(waAudioSnippets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(waAudioSnippets.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Audio no encontrado" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/admin/audio-snippets error:", error);
    return NextResponse.json({ error: "Error al actualizar audio" }, { status: 500 });
  }
}

// DELETE: Remove an audio snippet
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    await db.delete(waAudioSnippets).where(eq(waAudioSnippets.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/audio-snippets error:", error);
    return NextResponse.json({ error: "Error al eliminar audio" }, { status: 500 });
  }
}
