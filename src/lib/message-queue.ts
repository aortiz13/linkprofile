/**
 * WhatsApp Message Queue / Debouncer
 * ────────────────────────────────────
 * Collects rapid-fire messages from the same phone number
 * and processes them as a single batch after a quiet period.
 *
 * Flow:
 *   1. Message arrives → added to queue for that phone
 *   2. Timer starts/resets (DEBOUNCE_MS = 8 seconds)
 *   3. If another message arrives within 8s → timer resets, message added
 *   4. After 8s of silence → all queued messages are joined and processed
 *   5. A RESPONSE_DELAY_MS (5 seconds) is added before sending the reply
 *
 * Example: User sends "Hola", "como", "estas" in 3 separate messages
 *   → Agent receives: "Hola\ncomo\nestas" as one input
 *   → Agent sends one response after 5s delay
 */

import { processIncomingMessage } from "@/lib/whatsapp-agent";

// ─── Config ──────────────────────────────────────────────────────────────────
const DEBOUNCE_MS = 8_000;       // Wait 8s of silence before processing
const RESPONSE_DELAY_MS = 5_000; // 5s delay before sending response (feel human)

// ─── In-memory queue (per phone) ─────────────────────────────────────────────
interface QueueEntry {
  messages: string[];
  senderName?: string;
  timer: ReturnType<typeof setTimeout>;
}

const messageQueue = new Map<string, QueueEntry>();

/**
 * Enqueue a message for a phone number.
 * Resets the debounce timer on each new message.
 */
export function enqueueMessage(
  phone: string,
  messageText: string,
  senderName?: string
): void {
  const existing = messageQueue.get(phone);

  if (existing) {
    // Add message to the queue and reset timer
    existing.messages.push(messageText);
    if (senderName) existing.senderName = senderName;
    clearTimeout(existing.timer);

    console.log(
      `[Queue] Message added for ${phone} (${existing.messages.length} queued). Timer reset.`
    );

    existing.timer = setTimeout(() => {
      flushQueue(phone);
    }, DEBOUNCE_MS);
  } else {
    // First message — create queue entry
    console.log(`[Queue] New queue for ${phone}. Waiting ${DEBOUNCE_MS / 1000}s for more messages...`);

    const timer = setTimeout(() => {
      flushQueue(phone);
    }, DEBOUNCE_MS);

    messageQueue.set(phone, {
      messages: [messageText],
      senderName,
      timer,
    });
  }
}

/**
 * Flush the queue — join all messages and process through the agent.
 */
async function flushQueue(phone: string): Promise<void> {
  const entry = messageQueue.get(phone);
  if (!entry) return;

  // Remove from queue immediately to prevent race conditions
  messageQueue.delete(phone);

  const combinedMessage = entry.messages.join("\n");
  const count = entry.messages.length;

  console.log(
    `[Queue] Flushing ${count} message(s) for ${phone}: "${combinedMessage.slice(0, 100)}..."`
  );

  // Add human-like delay before processing
  await new Promise((resolve) => setTimeout(resolve, RESPONSE_DELAY_MS));

  try {
    await processIncomingMessage(phone, combinedMessage, entry.senderName);
  } catch (err) {
    console.error(`[Queue] Error processing queued messages for ${phone}:`, err);
  }
}
