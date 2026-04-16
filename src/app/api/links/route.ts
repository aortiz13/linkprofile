import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET() {
  try {
    const profile = await db.query.profiles.findFirst();
    if (!profile) {
      return NextResponse.json({ links: [] });
    }

    const activeLinks = await db
      .select()
      .from(links)
      .where(and(eq(links.profileId, profile.id), eq(links.active, true)))
      .orderBy(asc(links.order));

    return NextResponse.json({ links: activeLinks });
  } catch (error) {
    console.error("GET /api/links error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
