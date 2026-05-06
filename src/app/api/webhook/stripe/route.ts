import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { funnelEvents } from "@/lib/db/schema";
import { and, desc, eq, ne } from "drizzle-orm";
import { createHmac, timingSafeEqual } from "crypto";

export const runtime = "nodejs";

interface StripeCheckoutSession {
  id: string;
  client_reference_id: string | null;
  amount_total: number | null;
  currency: string | null;
  metadata?: Record<string, string> | null;
}

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: StripeCheckoutSession;
  };
}

/**
 * Stripe webhook handler. Verifies the Stripe-Signature header and records a
 * `sale` funnel event on `checkout.session.completed`, attributed to the
 * funnel/variant that the visitor came from (looked up by sessionId, which we
 * pass through Stripe's `client_reference_id`).
 *
 * Configure in Stripe dashboard → Webhooks → endpoint `/api/webhook/stripe`,
 * event `checkout.session.completed`. Set STRIPE_WEBHOOK_SECRET env var.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET not set");
    return new NextResponse("Webhook not configured", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new NextResponse("Missing signature", { status: 400 });
  }

  // Read raw body for signature verification
  const rawBody = await req.text();

  if (!verifyStripeSignature(rawBody, signature, secret)) {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const session = event.data.object;
  const sessionId = session.client_reference_id;
  const stripeSessionId = session.id;

  if (!sessionId) {
    // Sale wasn't routed through our funnel — record but unattributed
    console.warn("[stripe webhook] sale without client_reference_id:", stripeSessionId);
    return NextResponse.json({ received: true, attributed: false });
  }

  // Idempotency: bail if we've already recorded this Stripe session
  const existingSale = await db.query.funnelEvents.findFirst({
    where: and(
      eq(funnelEvents.eventType, "sale"),
      eq(funnelEvents.stripeSessionId, stripeSessionId)
    ),
  });
  if (existingSale) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Look up the most recent attribution event (click or view) for this session
  const lastAttribution = await db.query.funnelEvents.findFirst({
    where: and(
      eq(funnelEvents.sessionId, sessionId),
      ne(funnelEvents.eventType, "sale")
    ),
    orderBy: [desc(funnelEvents.timestamp)],
  });

  if (!lastAttribution) {
    console.warn("[stripe webhook] no attribution found for sessionId:", sessionId);
    return NextResponse.json({ received: true, attributed: false });
  }

  await db.insert(funnelEvents).values({
    eventType: "sale",
    funnelSlug: lastAttribution.funnelSlug,
    variantKey: lastAttribution.variantKey,
    sessionId,
    amountCents: session.amount_total ?? null,
    currency: session.currency ?? null,
    stripeSessionId,
    metadata: {
      stripeEventId: event.id,
    },
  });

  return NextResponse.json({ received: true, attributed: true });
}

/**
 * Verify the Stripe webhook signature header. Format:
 *   t=<timestamp>,v1=<sig>[,v1=<sig>...]
 * Stripe signs `${timestamp}.${rawBody}` with HMAC-SHA256 using the secret.
 */
function verifyStripeSignature(rawBody: string, header: string, secret: string): boolean {
  const parts = header.split(",").reduce<Record<string, string[]>>((acc, part) => {
    const [k, v] = part.split("=");
    if (!k || !v) return acc;
    if (!acc[k]) acc[k] = [];
    acc[k].push(v);
    return acc;
  }, {});

  const timestamp = parts.t?.[0];
  const signatures = parts.v1 ?? [];
  if (!timestamp || signatures.length === 0) return false;

  // Reject events older than 5 minutes to mitigate replay attacks
  const ts = parseInt(timestamp, 10);
  if (Number.isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");

  return signatures.some((sig) => {
    try {
      const sigBuf = Buffer.from(sig, "hex");
      return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf);
    } catch {
      return false;
    }
  });
}
