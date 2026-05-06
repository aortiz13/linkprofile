/**
 * Broadcast Engine – Mass WhatsApp Messaging
 * ────────────────────────────────────────────
 * Handles spintax resolution, audience building, rate-limited sending,
 * and campaign lifecycle management.
 *
 * Anti-ban strategy:
 *   1. Spintax → each message is unique
 *   2. Random delays between sends (jitter)
 *   3. Periodic long pauses
 *   4. Max messages per session
 *   5. Personalisation with lead data
 *   6. Auto-pause on high error rate
 */

import { db } from "@/lib/db";
import {
  leads,
  broadcastCampaigns,
  broadcastRecipients,
  waConversations,
} from "@/lib/db/schema";
import { eq, and, isNotNull, inArray, gte, sql } from "drizzle-orm";
import {
  sendWhatsAppMessage,
  interpolateMessage,
} from "@/lib/evolution-api";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface BroadcastFilters {
  sources?: string[];
  funnelStages?: string[];
  hasPhone?: boolean;
  countries?: string[];
  maxDaysOld?: number;
  excludeOptedOut?: boolean;
}

export interface RateConfig {
  intervalMinMs: number;
  intervalMaxMs: number;
  pauseEveryN: number;
  pauseDurationMs: number;
  maxPerSession: number;
}

// ─── In-memory campaign state ────────────────────────────────────────────────
const activeCampaigns = new Map<string, { paused: boolean; cancelled: boolean }>();

// ─── Spintax Engine ──────────────────────────────────────────────────────────
/**
 * Resolve spintax syntax: {option1|option2|option3} → random pick.
 * Supports nested spintax. Requires at least one `|` so that `{{variable}}`
 * placeholders are left intact for interpolateMessage.
 */
export function resolveSpintax(template: string): string {
  const regex = /\{([^{}]*\|[^{}]*)\}/g;
  let result = template;
  for (let i = 0; i < 5; i++) {
    const previous = result;
    result = result.replace(regex, (_match, group: string) => {
      const options = group.split("|");
      return options[Math.floor(Math.random() * options.length)];
    });
    if (result === previous) break;
  }
  return result;
}

// ─── Audience Builder ────────────────────────────────────────────────────────
export async function buildRecipientList(
  profileId: string,
  filters: BroadcastFilters
): Promise<{ id: string; name: string; phone: string; email: string | null; occupation: string | null; source: string | null }[]> {
  const conditions = [
    eq(leads.profileId, profileId),
    isNotNull(leads.phone),
  ];

  if (filters.sources && filters.sources.length > 0) {
    conditions.push(inArray(leads.source, filters.sources));
  }
  if (filters.funnelStages && filters.funnelStages.length > 0) {
    conditions.push(inArray(leads.funnelStage, filters.funnelStages));
  }
  if (filters.countries && filters.countries.length > 0) {
    conditions.push(inArray(leads.country, filters.countries));
  }
  if (filters.maxDaysOld && filters.maxDaysOld > 0) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - filters.maxDaysOld);
    conditions.push(gte(leads.createdAt, cutoffDate));
  }

  const allLeads = await db
    .select({ id: leads.id, name: leads.name, phone: leads.phone, email: leads.email, occupation: leads.occupation, source: leads.source })
    .from(leads)
    .where(and(...conditions));

  if (filters.excludeOptedOut !== false) {
    const optedOutPhones = await db
      .select({ phone: waConversations.phone })
      .from(waConversations)
      .where(eq(waConversations.optedOut, true));
    const optedOutSet = new Set(optedOutPhones.map((r) => r.phone.replace(/[^0-9]/g, "")));
    return allLeads.filter((l) => {
      const cleanPhone = l.phone!.replace(/[^0-9]/g, "");
      return cleanPhone.length >= 8 && !optedOutSet.has(cleanPhone);
    }) as any;
  }

  return allLeads.filter((l) => {
    const cleanPhone = l.phone!.replace(/[^0-9]/g, "");
    return cleanPhone.length >= 8;
  }) as any;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Campaign Runner ─────────────────────────────────────────────────────────
export async function startCampaign(campaignId: string): Promise<void> {
  await db.update(broadcastCampaigns).set({ status: "sending", startedAt: new Date() }).where(eq(broadcastCampaigns.id, campaignId));
  activeCampaigns.set(campaignId, { paused: false, cancelled: false });

  const [campaign] = await db.select().from(broadcastCampaigns).where(eq(broadcastCampaigns.id, campaignId)).limit(1);
  if (!campaign) return;

  const rateConfig = campaign.rateConfig as RateConfig;
  const recipients = await db.select().from(broadcastRecipients).where(and(eq(broadcastRecipients.campaignId, campaignId), eq(broadcastRecipients.status, "pending")));

  let sentInSession = 0;
  let failedInSession = 0;

  for (const recipient of recipients) {
    const state = activeCampaigns.get(campaignId);
    if (!state || state.cancelled) {
      await db.update(broadcastCampaigns).set({ status: "cancelled", completedAt: new Date() }).where(eq(broadcastCampaigns.id, campaignId));
      activeCampaigns.delete(campaignId);
      return;
    }

    if (state.paused) {
      await db.update(broadcastCampaigns).set({ status: "paused" }).where(eq(broadcastCampaigns.id, campaignId));
      while (state.paused && !state.cancelled) { await sleep(2000); }
      if (state.cancelled) {
        await db.update(broadcastCampaigns).set({ status: "cancelled", completedAt: new Date() }).where(eq(broadcastCampaigns.id, campaignId));
        activeCampaigns.delete(campaignId);
        return;
      }
      await db.update(broadcastCampaigns).set({ status: "sending" }).where(eq(broadcastCampaigns.id, campaignId));
    }

    if (sentInSession >= rateConfig.maxPerSession) break;

    const totalAttempted = sentInSession + failedInSession;
    if (totalAttempted >= 5 && failedInSession / totalAttempted > 0.1) {
      console.log(`[Broadcast] Auto-paused: error rate ${Math.round((failedInSession / totalAttempted) * 100)}%`);
      await db.update(broadcastCampaigns).set({ status: "paused" }).where(eq(broadcastCampaigns.id, campaignId));
      activeCampaigns.delete(campaignId);
      return;
    }

    const spintaxResolved = resolveSpintax(campaign.template);
    const [leadData] = await db.select({ name: leads.name, email: leads.email, phone: leads.phone, occupation: leads.occupation, source: leads.source }).from(leads).where(eq(leads.id, recipient.leadId)).limit(1);

    const resourceTitle = leadData?.source?.replace("lead_magnet:", "") || "";
    const finalMessage = interpolateMessage(spintaxResolved, {
      name: leadData?.name || "",
      email: leadData?.email || "",
      phone: leadData?.phone || "",
      occupation: leadData?.occupation || "",
      resourceTitle,
    });

    console.log(`[Broadcast] Sending to ${recipient.phone}...`);
    const result = await sendWhatsAppMessage(recipient.phone, finalMessage);

    if (result.success) {
      sentInSession++;
      await db.update(broadcastRecipients).set({ status: "sent", messageSent: finalMessage, sentAt: new Date() }).where(eq(broadcastRecipients.id, recipient.id));
      await db.update(broadcastCampaigns).set({ sentCount: sql`${broadcastCampaigns.sentCount} + 1` }).where(eq(broadcastCampaigns.id, campaignId));
    } else {
      failedInSession++;
      await db.update(broadcastRecipients).set({ status: "failed", error: result.error || "Unknown error" }).where(eq(broadcastRecipients.id, recipient.id));
      await db.update(broadcastCampaigns).set({ failedCount: sql`${broadcastCampaigns.failedCount} + 1` }).where(eq(broadcastCampaigns.id, campaignId));
    }

    const delayMs = randomBetween(rateConfig.intervalMinMs, rateConfig.intervalMaxMs);
    await sleep(delayMs);

    if (sentInSession > 0 && sentInSession % rateConfig.pauseEveryN === 0) {
      const pauseMs = randomBetween(rateConfig.pauseDurationMs * 0.8, rateConfig.pauseDurationMs * 1.2);
      console.log(`[Broadcast] Long pause: ${Math.round(pauseMs / 1000)}s`);
      await sleep(pauseMs);
    }
  }

  await db.update(broadcastCampaigns).set({ status: "completed", completedAt: new Date() }).where(eq(broadcastCampaigns.id, campaignId));
  activeCampaigns.delete(campaignId);
  console.log(`[Broadcast] Campaign ${campaignId} completed. Sent: ${sentInSession}, Failed: ${failedInSession}`);
}

export function pauseCampaign(campaignId: string): boolean {
  const state = activeCampaigns.get(campaignId);
  if (state) { state.paused = true; return true; }
  return false;
}

export function resumeCampaign(campaignId: string): boolean {
  const state = activeCampaigns.get(campaignId);
  if (state) { state.paused = false; return true; }
  return false;
}

export function cancelCampaign(campaignId: string): boolean {
  const state = activeCampaigns.get(campaignId);
  if (state) { state.cancelled = true; return true; }
  return false;
}

export function isCampaignActive(campaignId: string): boolean {
  return activeCampaigns.has(campaignId);
}
