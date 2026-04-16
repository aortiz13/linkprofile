import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const profile = await db.query.profiles.findFirst();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      name: profile.name,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      username: profile.username,
    });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
