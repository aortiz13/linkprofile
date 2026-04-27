import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leadMagnets } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const [magnet] = await db
      .select()
      .from(leadMagnets)
      .where(and(eq(leadMagnets.slug, slug), eq(leadMagnets.active, true)))
      .limit(1);

    if (!magnet) {
      return NextResponse.json(
        { error: "No encontrado" },
        { status: 404 }
      );
    }

    // Return only the public-facing data (no resourceUrl before form submission)
    return NextResponse.json({
      success: true,
      leadMagnet: {
        title: magnet.title,
        description: magnet.description,
        buttonText: magnet.buttonText,
        coverImage: magnet.coverImage,
        showName: magnet.showName,
        showEmail: magnet.showEmail,
        showWhatsapp: magnet.showWhatsapp,
        showOccupation: magnet.showOccupation,
        occupationOptions: magnet.occupationOptions,
        slug: magnet.slug,
      },
    });
  } catch (error) {
    console.error("Error fetching lead magnet:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
