import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { z } from "zod";

const leadSchema = z.object({
  profileId: z.string().uuid(),
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

    const { profileId, name, email, phone, message, source } = parsed.data;

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
