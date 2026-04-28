/**
 * Evolution API Webhook Receiver
 * ─────────────────────────────
 * Receives MESSAGES_UPSERT events from Evolution API,
 * extracts the incoming message, and processes it through the AI agent.
 */

import { NextResponse } from "next/server";
import { processIncomingMessage } from "@/lib/whatsapp-agent";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Log incoming webhook for debugging
    console.log(
      "[Webhook] Received event:",
      body.event,
      "| Instance:",
      body.instance
    );
    console.log("[Webhook] Full payload:", JSON.stringify(body, null, 2));

    // Only process messages.upsert events
    if (body.event !== "messages.upsert") {
      return NextResponse.json({ status: "ignored", reason: "not messages.upsert" });
    }

    const data = body.data;
    if (!data || !data.key) {
      return NextResponse.json({ status: "ignored", reason: "no data" });
    }

    // Skip messages sent by us (fromMe = true)
    if (data.key.fromMe) {
      return NextResponse.json({ status: "ignored", reason: "fromMe" });
    }

    // Skip group messages (only handle direct/private messages)
    const remoteJid: string = data.key.remoteJid || "";
    if (remoteJid.endsWith("@g.us")) {
      return NextResponse.json({ status: "ignored", reason: "group_message" });
    }

    // Extract phone number — handle LID (Linked ID) format
    // When remoteJid ends with @lid, the real phone is in remoteJidAlt
    let phoneJid = remoteJid;
    if (remoteJid.endsWith("@lid") && data.key.remoteJidAlt) {
      phoneJid = data.key.remoteJidAlt;
    }
    const phone = phoneJid.split("@")[0];
    console.log(`[Webhook] remoteJid: ${remoteJid} | resolved phone: ${phone}`);

    if (!phone || phone.length < 8) {
      return NextResponse.json(
        { status: "error", reason: "invalid_phone" },
        { status: 400 }
      );
    }

    // Extract message text
    let messageText = "";
    if (data.message?.conversation) {
      messageText = data.message.conversation;
    } else if (data.message?.extendedTextMessage?.text) {
      messageText = data.message.extendedTextMessage.text;
    } else if (data.message?.imageMessage?.caption) {
      messageText = data.message.imageMessage.caption;
    } else if (data.message?.videoMessage?.caption) {
      messageText = data.message.videoMessage.caption;
    } else if (data.message?.documentMessage?.caption) {
      messageText = data.message.documentMessage.caption;
    }

    // If no text content, skip (audio, stickers, etc.)
    if (!messageText.trim()) {
      console.log("[Webhook] Non-text message received, skipping.");
      return NextResponse.json({
        status: "ignored",
        reason: "non_text_message",
      });
    }

    // Extract sender name if available
    const senderName: string | undefined = data.pushName || undefined;

    // Process the message through the AI agent (fire-and-forget to respond fast)
    // We respond to the webhook immediately and process async
    const processPromise = processIncomingMessage(phone, messageText, senderName)
      .catch((err) => {
        console.error("[Webhook] Agent processing error:", err);
      });

    // Don't await — respond to webhook immediately to avoid timeout
    // Node.js will keep the promise alive
    void processPromise;

    return NextResponse.json({ status: "processing" });
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Also handle GET for webhook verification
export async function GET() {
  return NextResponse.json({ status: "ok", service: "wa-agent-webhook" });
}
