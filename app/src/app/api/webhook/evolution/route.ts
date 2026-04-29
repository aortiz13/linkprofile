/**
 * Evolution API Webhook Receiver
 * ─────────────────────────────
 * Receives MESSAGES_UPSERT events from Evolution API,
 * extracts the incoming message (text or audio), and enqueues it
 * for debounced processing.
 *
 * Audio messages are transcribed via OpenAI Whisper before processing.
 * Messages from the same phone within 8 seconds are batched into one.
 */

import { NextResponse } from "next/server";
import { enqueueMessage } from "@/lib/message-queue";
import { getMediaBase64 } from "@/lib/evolution-api";
import { transcribeAudio } from "@/lib/audio-transcribe";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Log incoming webhook
    console.log(
      "[Webhook] Received event:",
      body.event,
      "| Instance:",
      body.instance
    );

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

    // Extract sender name if available
    const senderName: string | undefined = data.pushName || undefined;

    // ─── Extract message content (text or audio) ─────────────────────────
    let messageText = "";
    const isAudio = !!data.message?.audioMessage;

    if (isAudio) {
      // Audio message → download and transcribe
      console.log(`[Webhook] Audio message from ${phone}, downloading...`);

      // Fire-and-forget audio processing (respond to webhook immediately)
      const audioPromise = (async () => {
        try {
          const media = await getMediaBase64({
            key: data.key,
            message: data.message,
          });

          if (!media) {
            console.error("[Webhook] Failed to download audio");
            enqueueMessage(phone, "[El usuario envió un audio que no se pudo procesar]", senderName);
            return;
          }

          const transcription = await transcribeAudio(media.base64, media.mimetype);

          if (!transcription) {
            enqueueMessage(phone, "[El usuario envió un audio que no se pudo transcribir]", senderName);
            return;
          }

          // Enqueue the transcribed text with a marker that it was audio
          enqueueMessage(phone, `[Audio transcrito]: ${transcription}`, senderName);
        } catch (err) {
          console.error("[Webhook] Audio processing error:", err);
          enqueueMessage(phone, "[El usuario envió un audio que no se pudo procesar]", senderName);
        }
      })();

      void audioPromise;
      return NextResponse.json({ status: "processing_audio" });
    }

    // Text messages
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

    // If no text content, skip (stickers, reactions, etc.)
    if (!messageText.trim()) {
      console.log("[Webhook] Non-text/non-audio message received, skipping.");
      return NextResponse.json({
        status: "ignored",
        reason: "non_text_message",
      });
    }

    // Enqueue message for debounced processing
    enqueueMessage(phone, messageText, senderName);

    return NextResponse.json({ status: "queued" });
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
