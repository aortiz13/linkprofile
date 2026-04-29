import { NextResponse } from "next/server";
import { checkWhatsAppNumber } from "@/lib/evolution-api";
import { z } from "zod";

const validateSchema = z.object({
  phone: z.string().min(8, "Número demasiado corto"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = validateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const { phone } = parsed.data;
    const valid = await checkWhatsAppNumber(phone);

    return NextResponse.json({ valid });
  } catch (error) {
    console.error("Error validating WhatsApp number:", error);
    // On server error, fail-open (allow the submission)
    return NextResponse.json({ valid: true }, { status: 200 });
  }
}
