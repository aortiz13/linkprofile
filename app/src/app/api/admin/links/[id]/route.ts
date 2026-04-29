import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  url: z.string().min(1).optional(),
  type: z.string().optional(),
  icon: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  active: z.boolean().optional(),
  blockId: z.string().uuid().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// PATCH - update a link
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const [updated] = await db
    .update(links)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(links.id, id), eq(links.profileId, user.profileId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

// DELETE - remove a link
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [deleted] = await db
    .delete(links)
    .where(and(eq(links.id, id), eq(links.profileId, user.profileId)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
