import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/track/behavior
 * Receives batched behavior events from the client-side tracker.
 * Calculates a lead score and could notify admin for hot leads.
 */
export async function POST(req: NextRequest) {
  try {
    // Support both JSON body and sendBeacon (which sends as text/plain sometimes)
    let body: { events: Array<{ type: string; value: string | number; ts: number }>; sessionId: string; url: string };

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const text = await req.text();
      body = JSON.parse(text);
    }

    const { events, sessionId } = body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ ok: true });
    }

    // Calculate lead score from events
    let score = 0;
    const scrollEvents = events.filter((e) => e.type === "scroll");
    const maxScroll = Math.max(...scrollEvents.map((e) => Number(e.value)), 0);
    if (maxScroll >= 75) score += 20;
    else if (maxScroll >= 50) score += 10;

    const timeEvents = events.filter((e) => e.type === "time");
    const maxTime = Math.max(...timeEvents.map((e) => Number(e.value)), 0);
    if (maxTime > 120) score += 15;
    else if (maxTime > 60) score += 8;

    const productHovers = events.filter((e) => e.type === "hover_product").length;
    score += Math.min(productHovers * 10, 25);

    const productClicks = events.filter((e) => e.type === "click_product").length;
    score += Math.min(productClicks * 15, 25);

    const formFocuses = events.filter((e) => e.type === "form_focus").length;
    if (formFocuses > 0) score += 30;

    score = Math.min(score, 100);

    // Log hot leads (score >= 70)
    if (score >= 70) {
      console.log(
        `🔥 HOT LEAD detected! Score: ${score}/100 | Session: ${sessionId} | ` +
        `Scroll: ${maxScroll}% | Time: ${maxTime}s | Product hovers: ${productHovers} | ` +
        `Form focus: ${formFocuses > 0 ? "Yes" : "No"}`
      );

      // Future: Send webhook notification to admin
      // await sendHotLeadNotification({ score, sessionId, events });
    }

    return NextResponse.json({ ok: true, score });
  } catch (error) {
    // Behavior tracking should never fail visibly
    return NextResponse.json({ ok: true });
  }
}
