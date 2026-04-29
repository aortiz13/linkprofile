import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { blocks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

async function getProfileId() {
  const user = await getCurrentUser();
  return user?.profileId || null;
}

// PATCH — Update a block's config, title, or visibility
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profileId = await getProfileId();
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (body.title !== undefined) updateData.title = body.title;
  if (body.visible !== undefined) updateData.visible = body.visible;
  if (body.config !== undefined) updateData.config = body.config;

  const [updated] = await db
    .update(blocks)
    .set(updateData)
    .where(and(eq(blocks.id, id), eq(blocks.profileId, profileId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(updated);
}

// DELETE — Remove a block
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profileId = await getProfileId();
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await db
    .delete(blocks)
    .where(and(eq(blocks.id, id), eq(blocks.profileId, profileId)));

  return NextResponse.json({ success: true });
}
