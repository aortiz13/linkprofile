import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { eq, asc, and, isNull } from "drizzle-orm";
import { z } from "zod";

// GET all links (active + inactive), optionally filtered by blockId
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const blockId = req.nextUrl.searchParams.get("blockId");

  let allLinks;
  if (blockId) {
    // Fetch links belonging to this specific block
    allLinks = await db
      .select()
      .from(links)
      .where(and(eq(links.profileId, user.profileId), eq(links.blockId, blockId)))
      .orderBy(asc(links.order));

    // Auto-migrate: if no links found for this block, assign unassigned links to it
    if (allLinks.length === 0) {
      const unassigned = await db
        .select()
        .from(links)
        .where(and(eq(links.profileId, user.profileId), isNull(links.blockId)))
        .orderBy(asc(links.order));

      if (unassigned.length > 0) {
        // Assign all unassigned links to this block
        await db
          .update(links)
          .set({ blockId, updatedAt: new Date() })
          .where(and(eq(links.profileId, user.profileId), isNull(links.blockId)));

        // Re-fetch the now-assigned links
        allLinks = await db
          .select()
          .from(links)
          .where(and(eq(links.profileId, user.profileId), eq(links.blockId, blockId)))
          .orderBy(asc(links.order));
      }
    }
  } else {
    // Fetch all links (legacy behavior)
    allLinks = await db
      .select()
      .from(links)
      .where(eq(links.profileId, user.profileId))
      .orderBy(asc(links.order));
  }

  return NextResponse.json({ links: allLinks });
}

// Create a new link
const createSchema = z.object({
  title: z.string().min(1).max(100),
  url: z.string().min(1),
  type: z.string().default("custom"),
  icon: z.string().optional(),
  imageUrl: z.string().optional(),
  active: z.boolean().default(true),
  blockId: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  // Check active link limit
  const maxLinks = parseInt(process.env.MAX_ACTIVE_LINKS || "30");
  const existingLinks = await db
    .select()
    .from(links)
    .where(eq(links.profileId, user.profileId));

  const activeCount = existingLinks.filter((l) => l.active).length;
  if (parsed.data.active && activeCount >= maxLinks) {
    return NextResponse.json(
      { error: `Máximo ${maxLinks} links activos permitidos` },
      { status: 400 }
    );
  }

  // Get next order (within the block if blockId specified)
  const orderLinks = parsed.data.blockId
    ? existingLinks.filter((l) => l.blockId === parsed.data.blockId)
    : existingLinks;
  const maxOrder = orderLinks.reduce((max, l) => Math.max(max, l.order), -1);

  const [newLink] = await db
    .insert(links)
    .values({
      ...parsed.data,
      profileId: user.profileId,
      order: maxOrder + 1,
    })
    .returning();

  return NextResponse.json(newLink, { status: 201 });
}
