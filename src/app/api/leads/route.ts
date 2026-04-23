import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const leadSchema = z.object({
  profileId: z.string().uuid().optional(),
  username: z.string().min(1).optional(),
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(1).optional().or(z.literal("")),
  message: z.string().optional().or(z.literal("")),
  source: z.string().optional().or(z.literal("")),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const { profileId: directProfileId, username, name, email, phone, message, source } = parsed.data;

    // Resolve profileId: directly provided, by username, or fallback to first profile
    let profileId = directProfileId;
    if (!profileId && username) {
      const [profile] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.username, username))
        .limit(1);
      if (profile) profileId = profile.id;
    }

    // Fallback: use the first profile (matches main page behavior)
    if (!profileId) {
      const [firstProfile] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .limit(1);
      if (!firstProfile) {
        return NextResponse.json({ error: "No hay perfiles configurados" }, { status: 404 });
      }
      profileId = firstProfile.id;
    }

    // Verify phone or email is provided
    if (!email && !phone) {
      return NextResponse.json(
        { error: "Se requiere email o teléfono" },
        { status: 400 }
      );
    }

    // Detect country from request headers (Cloudflare, Vercel, etc.)
    const country =
      req.headers.get("cf-ipcountry") ||
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("x-country") ||
      null;

    const newLead = await db
      .insert(leads)
      .values({
        profileId,
        name,
        email: email || null,
        phone: phone || null,
        message: message || null,
        source: source || null,
        country,
      })
      .returning();

    return NextResponse.json({ success: true, lead: newLead[0] });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
