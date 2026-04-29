/**
 * Evolution API Webhook Setup
 * ───────────────────────────
 * One-time endpoint to configure the Evolution API webhook
 * to point to our /api/webhook/evolution endpoint.
 *
 * POST /api/webhook/evolution/setup
 * Protected by admin session cookie
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const EVOLUTION_API_URL = "https://qr.mi-hogar.org";
const EVOLUTION_INSTANCE = "Adrian";
const EVOLUTION_API_KEY = "B81DB1EF3C9C-4353-8C2E-6CEB9D0C9464";

export async function POST(req: Request) {
  // Auth check using the app's existing auth system
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const webhookUrl =
      (body as { url?: string }).url ||
      `${process.env.NEXT_PUBLIC_APP_URL || "https://adrian-ortiz.com"}/api/webhook/evolution`;

    const response = await fetch(
      `${EVOLUTION_API_URL}/webhook/set/${EVOLUTION_INSTANCE}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          webhook: {
            enabled: true,
            url: webhookUrl,
            headers: {
              "Content-Type": "application/json",
            },
            byEvents: false,
            base64: false,
            events: ["MESSAGES_UPSERT"],
          },
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Evolution API error", details: result },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Webhook configured to ${webhookUrl}`,
      result,
    });
  } catch (error) {
    console.error("[Webhook Setup] Error:", error);
    return NextResponse.json(
      { error: "Failed to setup webhook" },
      { status: 500 }
    );
  }
}

// GET — show current webhook status
export async function GET() {
  try {
    const response = await fetch(
      `${EVOLUTION_API_URL}/webhook/find/${EVOLUTION_INSTANCE}`,
      {
        headers: { apikey: EVOLUTION_API_KEY },
      }
    );

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Webhook Setup] Error fetching status:", error);
    return NextResponse.json(
      { error: "Failed to fetch webhook status" },
      { status: 500 }
    );
  }
}
