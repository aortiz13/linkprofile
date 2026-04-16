import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { blocks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

async function getProfileId() {
  const user = await getCurrentUser();
  return user?.profileId || null;
}

// PUT — Reorder blocks
export async function PUT(req: Request) {
  const profileId = await getProfileId();
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderedIds } = await req.json();

  if (!Array.isArray(orderedIds)) {
    return NextResponse.json({ error: "orderedIds must be an array" }, { status: 400 });
  }

  // Update each block's order in a transaction
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx
        .update(blocks)
        .set({ order: i, updatedAt: new Date() })
        .where(and(eq(blocks.id, orderedIds[i]), eq(blocks.profileId, profileId)));
    }
  });

  return NextResponse.json({ success: true });
}
