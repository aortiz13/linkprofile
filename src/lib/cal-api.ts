/**
 * Cal.com API v2 Integration
 * ──────────────────────────
 * Fetches available slots and creates bookings programmatically
 * via the Cal.com public API v2.
 *
 * Required env vars:
 *   CAL_API_KEY       — Your Cal.com API key (cal_live_... or cal_test_...)
 *   CAL_EVENT_TYPE_ID — The numeric event type ID for "llamada"
 *   CAL_USERNAME      — Your Cal.com username (fallback for slug-based booking)
 */

const CAL_BASE = "https://api.cal.com/v2";
const CAL_API_VERSION = "2024-08-13";

function getHeaders(): Record<string, string> {
  const apiKey = process.env.CAL_API_KEY;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "cal-api-version": CAL_API_VERSION,
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }
  return headers;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CalSlot {
  time: string; // ISO 8601 UTC
}

export interface CalSlotsResponse {
  [date: string]: CalSlot[];
}

export interface CalBookingResult {
  success: boolean;
  bookingId?: string;
  uid?: string;
  startTime?: string;
  endTime?: string;
  meetUrl?: string;
  error?: string;
}

// ─── Get Available Slots ─────────────────────────────────────────────────────

/**
 * Fetches available slots for a given date range.
 * @param startDate  ISO 8601 UTC start (e.g. "2026-05-01T00:00:00Z")
 * @param endDate    ISO 8601 UTC end   (e.g. "2026-05-07T23:59:59Z")
 * @param timeZone   Optional timezone  (e.g. "America/Argentina/Buenos_Aires")
 * @returns Object keyed by date with arrays of available slot times
 */
export async function getAvailableSlots(
  startDate: string,
  endDate: string,
  timeZone?: string
): Promise<{ slots: CalSlotsResponse; error?: string }> {
  const eventTypeId = process.env.CAL_EVENT_TYPE_ID;
  if (!eventTypeId) {
    return { slots: {}, error: "CAL_EVENT_TYPE_ID not configured" };
  }

  const params = new URLSearchParams({
    eventTypeId,
    start: startDate,
    end: endDate,
  });
  if (timeZone) {
    params.set("timeZone", timeZone);
  }

  try {
    const res = await fetch(`${CAL_BASE}/slots?${params.toString()}`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[Cal API] Failed to fetch slots:", res.status, body);
      return { slots: {}, error: `Cal API error ${res.status}` };
    }

    const data = await res.json();
    // Cal.com v2 returns { status: "success", data: { slots: { "2026-05-01": [{time: "..."}] } } }
    const slots = data?.data?.slots || {};
    return { slots };
  } catch (err) {
    console.error("[Cal API] Network error fetching slots:", err);
    return { slots: {}, error: "Network error" };
  }
}

/**
 * Helper: Get available slots for a specific date, formatted for WhatsApp.
 * Returns a human-readable list of available times.
 */
export async function getFormattedSlotsForDate(
  date: string, // "2026-05-01"
  timeZone = "America/Argentina/Buenos_Aires"
): Promise<{ formatted: string; rawSlots: string[]; error?: string }> {
  const startDate = `${date}T00:00:00Z`;
  const endDate = `${date}T23:59:59Z`;

  const { slots, error } = await getAvailableSlots(startDate, endDate, timeZone);

  if (error) {
    return { formatted: "", rawSlots: [], error };
  }

  // Collect all slot times for this date
  const allSlots: string[] = [];
  for (const [, daySlots] of Object.entries(slots)) {
    for (const slot of daySlots) {
      allSlots.push(slot.time);
    }
  }

  if (allSlots.length === 0) {
    return { formatted: "No hay horarios disponibles para esa fecha.", rawSlots: [] };
  }

  // Format times for display
  const formatter = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
    hour12: false,
  });

  const formattedSlots = allSlots.map((slot) => {
    const d = new Date(slot);
    return `• ${formatter.format(d)} hs`;
  });

  return {
    formatted: `Horarios disponibles para ${date}:\n${formattedSlots.join("\n")}`,
    rawSlots: allSlots,
  };
}

/**
 * Helper: Get available slots for the next N days, summarized.
 */
export async function getNextAvailableDays(
  daysAhead = 5,
  timeZone = "America/Argentina/Buenos_Aires"
): Promise<{ summary: string; slotsByDate: Record<string, string[]>; error?: string }> {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + daysAhead);

  const startISO = start.toISOString();
  const endISO = end.toISOString();

  const { slots, error } = await getAvailableSlots(startISO, endISO, timeZone);

  if (error) {
    return { summary: "", slotsByDate: {}, error };
  }

  const slotsByDate: Record<string, string[]> = {};
  const dayFormatter = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  });
  const timeFormatter = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
    hour12: false,
  });

  const lines: string[] = [];

  for (const [dateKey, daySlots] of Object.entries(slots)) {
    if (daySlots.length === 0) continue;

    const firstSlotDate = new Date(daySlots[0].time);
    const dayLabel = dayFormatter.format(firstSlotDate);
    const times = daySlots.map((s) => timeFormatter.format(new Date(s.time)));

    slotsByDate[dateKey] = daySlots.map((s) => s.time);
    lines.push(`📅 *${capitalize(dayLabel)}*: ${times.join(", ")} hs`);
  }

  if (lines.length === 0) {
    return {
      summary: "No tengo horarios disponibles en los próximos días.",
      slotsByDate: {},
    };
  }

  return {
    summary: `Mis horarios disponibles:\n\n${lines.join("\n")}`,
    slotsByDate,
  };
}

// ─── Create Booking ──────────────────────────────────────────────────────────

/**
 * Creates a booking on Cal.com.
 * @param slotTime   ISO 8601 UTC start time of the selected slot
 * @param attendee   { name, email, timeZone, phoneNumber? }
 */
export async function createBooking(
  slotTime: string,
  attendee: {
    name: string;
    email: string;
    timeZone?: string;
    phoneNumber?: string;
  }
): Promise<CalBookingResult> {
  const eventTypeId = process.env.CAL_EVENT_TYPE_ID;
  const username = process.env.CAL_USERNAME || "adrianortiz";

  // Build request body
  const body: Record<string, unknown> = {
    start: slotTime,
    attendee: {
      name: attendee.name,
      email: attendee.email,
      timeZone: attendee.timeZone || "America/Argentina/Buenos_Aires",
      language: "es",
    },
  };

  if (attendee.phoneNumber) {
    (body.attendee as Record<string, unknown>).phoneNumber = attendee.phoneNumber;
  }

  // Prefer eventTypeId, fallback to slug+username
  if (eventTypeId) {
    body.eventTypeId = parseInt(eventTypeId, 10);
  } else {
    body.eventTypeSlug = "llamada";
    body.username = username;
  }

  try {
    const res = await fetch(`${CAL_BASE}/bookings`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[Cal API] Failed to create booking:", res.status, JSON.stringify(data));
      return {
        success: false,
        error: data?.error?.message || data?.message || `Cal API error ${res.status}`,
      };
    }

    // Cal.com v2 response: { status: "success", data: { id, uid, start, end, meetingUrl, ... } }
    const booking = data?.data;
    return {
      success: true,
      bookingId: String(booking?.id || ""),
      uid: booking?.uid || "",
      startTime: booking?.start || booking?.startTime || slotTime,
      endTime: booking?.end || booking?.endTime || "",
      meetUrl: booking?.meetingUrl || booking?.metadata?.videoCallUrl || "",
    };
  } catch (err) {
    console.error("[Cal API] Network error creating booking:", err);
    return { success: false, error: "Network error creating booking" };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
