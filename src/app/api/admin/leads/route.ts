import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allLeads = await db
      .select()
      .from(leads)
      .where(eq(leads.profileId, user.profileId))
      .orderBy(desc(leads.createdAt));

    return NextResponse.json({ success: true, leads: allLeads });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
