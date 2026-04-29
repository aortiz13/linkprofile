import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const reorderSchema = z.object({
  ids: z.array(z.string().uuid()),
});

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { ids } = parsed.data;

  // Update order for each link
  await Promise.all(
    ids.map((id, index) =>
      db
        .update(links)
        .set({ order: index, updatedAt: new Date() })
        .where(eq(links.id, id))
    )
  );

  return new NextResponse(null, { status: 204 });
}
