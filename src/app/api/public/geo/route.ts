import { NextRequest, NextResponse } from "next/server";
import { getGeo } from "@/lib/geo";

export async function GET(req: NextRequest) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;

    const geo = await getGeo(ip);

    // Provide strong cache control headers so intermediate CDNs might cache 
    // but the browser definitely caches this since the user's location rarely changes per session.
    return NextResponse.json(geo, {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("GET /api/public/geo error:", error);
    return NextResponse.json({ country: null }, { status: 500 });
  }
}
