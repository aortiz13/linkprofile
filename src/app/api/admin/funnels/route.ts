import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { funnels } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// GET — list all funnels
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const all = await db.select().from(funnels).orderBy(desc(funnels.createdAt));
    return NextResponse.json({ success: true, funnels: all });
  } catch (error) {
    console.error("Error fetching funnels:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH — update funnel (active, variants weights, etc.)
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, active, variants } = await req.json();
    if (!id) return NextResponse.json({ error: "Funnel ID required" }, { status: 400 });

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof active === "boolean") updates.active = active;
    if (variants) updates.variants = variants;

    const [updated] = await db
      .update(funnels)
      .set(updates)
      .where(eq(funnels.id, id))
      .returning();

    return NextResponse.json({ success: true, funnel: updated });
  } catch (error) {
    console.error("Error updating funnel:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
