/**
 * No-Reply Follow-up Scheduler
 * ──────────────────────────────
 * Manages automatic follow-ups when a user doesn't respond.
 *
 * Flow:
 *   1st follow-up: 30 minutes after last agent message
 *   2nd follow-up: 4 hours (respecting quiet hours 00:00–06:00 → delayed to 07:30)
 *   3rd follow-up: Next day — asks if they want to opt out
 *
 * Timers are cancelled when the user responds.
 */

import { db } from "@/lib/db";
import { waConversations, waMessages } from "@/lib/db/schema";
import { and, desc, eq, lt } from "drizzle-orm";
import { sendWhatsAppMessage } from "@/lib/evolution-api";

// ─── In-memory timer storage ─────────────────────────────────────────────────
const pendingFollowups = new Map<string, ReturnType<typeof setTimeout>>();

// ─── Country → UTC offset (approximate, for quiet hours) ────────────────────
const COUNTRY_UTC_OFFSETS: Record<string, number> = {
  UY: -3,  // Uruguay
  AR: -3,  // Argentina
  BR: -3,  // Brazil (most)
  CL: -4,  // Chile
  CO: -5,  // Colombia
  MX: -6,  // Mexico
  PE: -5,  // Peru
  EC: -5,  // Ecuador
  VE: -4,  // Venezuela
  PY: -4,  // Paraguay
  BO: -4,  // Bolivia
  CR: -6,  // Costa Rica
  PA: -5,  // Panama
  DO: -4,  // Dominican Republic
  GT: -6,  // Guatemala
  HN: -6,  // Honduras
  SV: -6,  // El Salvador
  NI: -6,  // Nicaragua
  CU: -5,  // Cuba
  PR: -4,  // Puerto Rico
  ES: 1,   // Spain
  US: -5,  // USA (Eastern, default)
};

/**
 * Cancel any pending no-reply follow-ups for a phone.
 * Call this whenever the user sends a message.
 */
export function cancelNoReplyFollowups(phone: string): void {
  // Cancel all 3 possible follow-ups
  for (let i = 1; i <= 3; i++) {
    const key = `${phone}:noreply:${i}`;
    const timer = pendingFollowups.get(key);
    if (timer) {
      clearTimeout(timer);
      pendingFollowups.delete(key);
      console.log(`[NoReply] Cancelled follow-up #${i} for ${phone}`);
    }
  }
}

/**
 * Reset the follow-up counter when user responds.
 */
export async function resetNoReplyCount(conversationId: string): Promise<void> {
  await db
    .update(waConversations)
    .set({ noReplyFollowups: 0 })
    .where(eq(waConversations.id, conversationId));
}

/**
 * Schedule no-reply follow-ups after the agent sends a message.
 */
export function scheduleNoReplyFollowups(
  phone: string,
  conversationId: string,
  country?: string | null
): void {
  // Cancel any existing timers first
  cancelNoReplyFollowups(phone);

  // Follow-up #1: 30 minutes
  const key1 = `${phone}:noreply:1`;
  pendingFollowups.set(
    key1,
    setTimeout(async () => {
      pendingFollowups.delete(key1);
      await sendNoReplyFollowup(phone, conversationId, 1);
    }, 30 * 60 * 1000) // 30 minutes
  );

  // Follow-up #2: 4 hours (respecting quiet hours)
  const key2 = `${phone}:noreply:2`;
  const fourHoursMs = 4 * 60 * 60 * 1000;
  const delayMs2 = calculateSmartDelay(fourHoursMs, country || null);
  pendingFollowups.set(
    key2,
    setTimeout(async () => {
      pendingFollowups.delete(key2);
      await sendNoReplyFollowup(phone, conversationId, 2);
    }, delayMs2)
  );

  // Follow-up #3: Next day (24 hours)
  const key3 = `${phone}:noreply:3`;
  const twentyFourHoursMs = 24 * 60 * 60 * 1000;
  const delayMs3 = calculateSmartDelay(twentyFourHoursMs, country || null);
  pendingFollowups.set(
    key3,
    setTimeout(async () => {
      pendingFollowups.delete(key3);
      await sendNoReplyFollowup(phone, conversationId, 3);
    }, delayMs3)
  );

  console.log(
    `[NoReply] Scheduled 3 follow-ups for ${phone}: #1 in 30min, #2 in ${Math.round(delayMs2 / 60000)}min, #3 in ${Math.round(delayMs3 / 60000)}min`
  );
}

/**
 * Calculate delay respecting quiet hours (00:00–06:00 → deliver at 07:30).
 */
function calculateSmartDelay(baseDelayMs: number, country: string | null): number {
  const utcOffset = country ? (COUNTRY_UTC_OFFSETS[country.toUpperCase()] ?? -3) : -3;

  const deliveryTimeUTC = new Date(Date.now() + baseDelayMs);
  const localHour = (deliveryTimeUTC.getUTCHours() + utcOffset + 24) % 24;

  // If delivery would be between 00:00 and 06:59 → push to 07:30
  if (localHour >= 0 && localHour < 7) {
    const hoursToWait = 7.5 - localHour; // hours until 07:30
    return baseDelayMs + hoursToWait * 60 * 60 * 1000;
  }

  return baseDelayMs;
}

// ─── Follow-up messages ──────────────────────────────────────────────────────
async function sendNoReplyFollowup(
  phone: string,
  conversationId: string,
  followupNumber: number
): Promise<void> {
  // Re-check conversation state (might have responded in the meantime)
  const [conv] = await db
    .select()
    .from(waConversations)
    .where(eq(waConversations.id, conversationId))
    .limit(1);

  if (!conv || !conv.active || conv.optedOut) return;

  // Check if the user sent a message after our last message — read the most
  // recent message and bail if it's from the user.
  const [lastMsg] = await db
    .select({ role: waMessages.role, content: waMessages.content })
    .from(waMessages)
    .where(eq(waMessages.conversationId, conversationId))
    .orderBy(desc(waMessages.createdAt))
    .limit(1);

  if (lastMsg && lastMsg.role === "user") {
    console.log(`[NoReply] User ${phone} already responded, skipping follow-up #${followupNumber}`);
    return;
  }

  const ctx = conv.leadContext as Record<string, string> | null;
  const firstName = ctx?.name ? ctx.name.trim().split(/\s+/)[0] : "";

  let message = "";

  switch (followupNumber) {
    case 1:
      // 30 minutes - gentle check-in
      message = firstName
        ? `${firstName}, pudiste ver mi mensaje? 😊`
        : `Hola! Pudiste ver mi mensaje? 😊`;
      break;

    case 2:
      // 4 hours - value reminder
      message = firstName
        ? `${firstName}, se me ocurrieron un par de ideas que podrían servirte. Cuando tengas un ratito avisame y te cuento 🚀`
        : `Se me ocurrieron un par de ideas que podrían servirte. Cuando tengas un ratito avisame y te cuento 🚀`;
      break;

    case 3:
      // Next day - opt-out offer
      message = firstName
        ? `${firstName}, no te quiero molestar! Si preferís que no te escriba más, decime tranquilo y lo entiendo perfectamente. Pero si en algún momento querés charlar sobre IA y automatización, acá estoy 🙌`
        : `No te quiero molestar! Si preferís que no te escriba más, decime tranquilo y lo entiendo perfectamente. Pero si en algún momento querés charlar sobre IA y automatización, acá estoy 🙌`;
      break;

    default:
      return;
  }

  // Defense in depth: if the assistant's most recent message is already this
  // exact text, this follow-up was already sent (e.g. by another replica or
  // by the same one before a restart that lost the in-memory counter sync).
  if (lastMsg && lastMsg.role === "assistant" && lastMsg.content === message) {
    console.log(`[NoReply] Follow-up #${followupNumber} already in transcript for ${phone} — skipping duplicate.`);
    return;
  }

  // Atomic claim: only proceed if this follow-up number hasn't been claimed
  // yet. Two concurrent firers (timer + restart, two replicas, retry) will
  // race on this UPDATE; only one row comes back.
  const claim = await db
    .update(waConversations)
    .set({ noReplyFollowups: followupNumber, updatedAt: new Date() })
    .where(
      and(
        eq(waConversations.id, conversationId),
        lt(waConversations.noReplyFollowups, followupNumber)
      )
    )
    .returning({ id: waConversations.id });

  if (claim.length === 0) {
    console.log(`[NoReply] Follow-up #${followupNumber} already claimed for ${phone}, skipping.`);
    return;
  }

  const result = await sendWhatsAppMessage(phone, message);

  if (result.success) {
    // Store message in memory (counter was already incremented by the claim).
    await db.insert(waMessages).values({
      conversationId,
      role: "assistant",
      content: message,
    });

    console.log(`[NoReply] Follow-up #${followupNumber} sent to ${phone}`);
  } else {
    console.error(`[NoReply] Follow-up #${followupNumber} send failed for ${phone}: ${result.error}`);
    // Counter already incremented — that's intentional. We'd rather lose a
    // failed follow-up than risk duplicating it on a retry.
  }
}
