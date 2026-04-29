import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.profileId),
  });

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  return NextResponse.json(profile);
}

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional().nullable(),
  username: z.string().min(1).max(50).optional(),
  theme: z.enum(["light", "dark", "remax"]).optional(),
  layout: z.enum(["list", "bento"]).optional(),
  whatsappNumber: z.string().max(20).optional().nullable(),
  vcardUrl: z.string().url().max(500).optional().nullable(),
  leadgenEnabled: z.boolean().optional(),
  leadgenTitle: z.string().max(100).optional().nullable(),
});

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const [updated] = await db
    .update(profiles)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(profiles.id, user.profileId))
    .returning();

  return NextResponse.json(updated);
}
