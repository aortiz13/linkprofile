/**
 * Cal.com API v2 Integration
 * ──────────────────────────
 * Provides functions to check availability and create bookings
 * via the Cal.com API v2 for the WhatsApp agent scheduling flow.
 *
 * Event: https://cal.com/adrianortiz/llamada
 */

// ─── Config ──────────────────────────────────────────────────────────────────
const CAL_API_KEY = process.env.CAL_COM_API_KEY || "";
const CAL_BASE_URL = "https://api.cal.com/v2";
const CAL_API_VERSION = "2024-08-13";
const CAL_EVENT_SLUG = "llamada";
const CAL_USERNAME = "adrianortiz";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface CalSlot {
  time: string; // ISO 8601 UTC
}

export interface CalAvailableSlots {
  [date: string]: CalSlot[];
}

export interface CalBookingResult {
  success: boolean;
  bookingId?: string;
  meetingUrl?: string;
  startTime?: string;
  endTime?: string;
  error?: string;
}

export interface FormattedSlotOption {
  label: string;       // e.g. "Miércoles 30 de abril, 10:00 AM"
  isoTime: string;     // ISO 8601 UTC for booking
  dayLabel: string;    // "Hoy" or "Mañana"
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Common headers for Cal.com API requests */
function calHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${CAL_API_KEY}`,
    "Content-Type": "application/json",
    "cal-api-version": CAL_API_VERSION,
  };
}

/** Format a date to Uruguay local time display */
function formatSlotForDisplay(isoTime: string, dayLabel: string): string {
  const date = new Date(isoTime);

  // Format in Uruguay timezone
  const timeStr = date.toLocaleTimeString("es-UY", {
    timeZone: "America/Montevideo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const dateStr = date.toLocaleDateString("es-UY", {
    timeZone: "America/Montevideo",
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Capitalize first letter
  const capitalized = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  return `${dayLabel} - ${capitalized}, ${timeStr} hs`;
}

// ─── Get Available Slots ─────────────────────────────────────────────────────

/**
 * Fetch available time slots from Cal.com for today and tomorrow.
 * Returns up to 3 formatted slot options for the agent to present.
 */
export async function getAvailableSlots(): Promise<{
  success: boolean;
  slots: FormattedSlotOption[];
  error?: string;
}> {
  if (!CAL_API_KEY) {
    console.error("[Cal.com] API key not configured");
    return { success: false, slots: [], error: "API key not configured" };
  }

  try {
    // Calculate today and tomorrow in UTC
    const now = new Date();
    const today = new Date(now);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(now);
    dayAfter.setDate(dayAfter.getDate() + 2);

    // Format dates as YYYY-MM-DD
    const startDate = today.toISOString().split("T")[0];
    const endDate = dayAfter.toISOString().split("T")[0];

    const url = new URL(`${CAL_BASE_URL}/slots`);
    url.searchParams.set("eventTypeSlug", CAL_EVENT_SLUG);
    url.searchParams.set("username", CAL_USERNAME);
    url.searchParams.set("start", startDate);
    url.searchParams.set("end", endDate);
    url.searchParams.set("timeZone", "America/Montevideo");

    console.log(`[Cal.com] Fetching slots: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: calHeaders(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[Cal.com] Slots API error ${response.status}:`, errorBody);
      return {
        success: false,
        slots: [],
        error: `API error: ${response.status}`,
      };
    }

    const data = await response.json();
    console.log("[Cal.com] Slots response:", JSON.stringify(data).slice(0, 500));

    // Parse the slots from the response
    // Cal.com v2 returns { status: "success", data: { slots: { "YYYY-MM-DD": [...] } } }
    const slotsData = data?.data?.slots || data?.data || {};

    const allSlots: FormattedSlotOption[] = [];

    // Get today's date string in Uruguay TZ
    const todayStr = today.toLocaleDateString("en-CA", { timeZone: "America/Montevideo" });
    const tomorrowStr = tomorrow.toLocaleDateString("en-CA", { timeZone: "America/Montevideo" });

    for (const [dateKey, slots] of Object.entries(slotsData)) {
      if (!Array.isArray(slots)) continue;

      for (const slot of slots) {
        const slotTime = slot.time || slot.start || slot;
        if (typeof slotTime !== "string") continue;

        const slotDate = new Date(slotTime);

        // Skip slots that are in the past (less than 1 hour from now)
        if (slotDate.getTime() < now.getTime() + 60 * 60 * 1000) continue;

        // Determine if it's today or tomorrow
        const slotDateStr = slotDate.toLocaleDateString("en-CA", { timeZone: "America/Montevideo" });
        let dayLabel = "";
        if (slotDateStr === todayStr) dayLabel = "Hoy";
        else if (slotDateStr === tomorrowStr) dayLabel = "Mañana";
        else dayLabel = "Próximo día";

        allSlots.push({
          label: formatSlotForDisplay(slotTime, dayLabel),
          isoTime: slotTime,
          dayLabel,
        });
      }
    }

    // Pick the best 3 slots: try to spread across time of day
    const selectedSlots = selectBestSlots(allSlots, 3);

    console.log(`[Cal.com] Found ${allSlots.length} available slots, selected ${selectedSlots.length}`);

    return { success: true, slots: selectedSlots };
  } catch (error) {
    console.error("[Cal.com] Error fetching slots:", error);
    return {
      success: false,
      slots: [],
      error: String(error),
    };
  }
}

/**
 * Select the best N slots trying to spread across morning, afternoon, evening
 * and mixing today/tomorrow.
 */
function selectBestSlots(
  slots: FormattedSlotOption[],
  count: number
): FormattedSlotOption[] {
  if (slots.length <= count) return slots;

  // Prefer variety: try to pick different times of day
  const morning: FormattedSlotOption[] = [];
  const afternoon: FormattedSlotOption[] = [];
  const evening: FormattedSlotOption[] = [];

  for (const slot of slots) {
    const hour = new Date(slot.isoTime).getHours();
    // Adjust for Uruguay timezone (UTC-3)
    const localHour = (hour - 3 + 24) % 24;

    if (localHour < 12) morning.push(slot);
    else if (localHour < 17) afternoon.push(slot);
    else evening.push(slot);
  }

  const selected: FormattedSlotOption[] = [];

  // Pick one from each bucket if available
  const buckets = [morning, afternoon, evening];
  for (const bucket of buckets) {
    if (selected.length >= count) break;
    if (bucket.length > 0) {
      selected.push(bucket[0]);
    }
  }

  // Fill remaining from all slots
  for (const slot of slots) {
    if (selected.length >= count) break;
    if (!selected.includes(slot)) {
      selected.push(slot);
    }
  }

  // Sort by time
  selected.sort(
    (a, b) => new Date(a.isoTime).getTime() - new Date(b.isoTime).getTime()
  );

  return selected;
}

// ─── Create Booking ──────────────────────────────────────────────────────────

/**
 * Create a booking on Cal.com.
 *
 * @param startTime - ISO 8601 UTC start time
 * @param attendeeName - Full name of the attendee
 * @param attendeeEmail - Email of the attendee
 * @param attendeePhone - Phone number (optional, for metadata)
 * @param attendeeTimezone - Timezone (defaults to America/Montevideo)
 */
export async function createBooking(
  startTime: string,
  attendeeName: string,
  attendeeEmail: string,
  attendeePhone?: string,
  attendeeTimezone: string = "America/Montevideo"
): Promise<CalBookingResult> {
  if (!CAL_API_KEY) {
    console.error("[Cal.com] API key not configured");
    return { success: false, error: "API key not configured" };
  }

  try {
    const body: Record<string, unknown> = {
      start: startTime,
      eventTypeSlug: CAL_EVENT_SLUG,
      attendee: {
        name: attendeeName,
        email: attendeeEmail,
        timeZone: attendeeTimezone,
        language: "es",
      },
      metadata: {
        source: "whatsapp_agent",
        phone: attendeePhone || "",
      },
    };

    console.log(
      `[Cal.com] Creating booking: ${startTime} for ${attendeeName} (${attendeeEmail})`
    );

    const response = await fetch(`${CAL_BASE_URL}/bookings`, {
      method: "POST",
      headers: calHeaders(),
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(
        `[Cal.com] Booking API error ${response.status}:`,
        JSON.stringify(data)
      );
      return {
        success: false,
        error: data?.error?.message || data?.message || `API error: ${response.status}`,
      };
    }

    console.log("[Cal.com] Booking created:", JSON.stringify(data).slice(0, 500));

    // Extract booking details from response
    const booking = data?.data;
    const meetingUrl =
      booking?.meetingUrl ||
      booking?.metadata?.videoCallUrl ||
      booking?.references?.find((r: { type: string; meetingUrl?: string }) => r.type === "google_meet" || r.type === "zoom")?.meetingUrl ||
      null;

    return {
      success: true,
      bookingId: booking?.uid || booking?.id,
      meetingUrl: meetingUrl,
      startTime: booking?.startTime || booking?.start || startTime,
      endTime: booking?.endTime || booking?.end,
    };
  } catch (error) {
    console.error("[Cal.com] Error creating booking:", error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Format a booking confirmation message for WhatsApp.
 */
export function formatBookingConfirmation(
  booking: CalBookingResult,
  attendeeName: string
): string {
  if (!booking.success || !booking.startTime) {
    return "Hubo un problema al crear la reunión. Intentemos de nuevo.";
  }

  const startDate = new Date(booking.startTime);

  const dateStr = startDate.toLocaleDateString("es-UY", {
    timeZone: "America/Montevideo",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const timeStr = startDate.toLocaleTimeString("es-UY", {
    timeZone: "America/Montevideo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const capitalizedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  let message = `📅 *Reunión confirmada*\n\n`;
  message += `👤 *Nombre:* ${attendeeName}\n`;
  message += `📆 *Fecha:* ${capitalizedDate}\n`;
  message += `🕐 *Hora:* ${timeStr} hs (Uruguay)\n`;

  if (booking.meetingUrl) {
    message += `\n🔗 *Link de la videollamada:*\n${booking.meetingUrl}\n`;
  }

  return message;
}
