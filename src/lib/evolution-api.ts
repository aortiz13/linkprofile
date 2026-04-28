/**
 * Evolution API – WhatsApp message sender
 * Docs: POST /message/sendText/{instanceName}
 */

const EVOLUTION_API_URL = "https://qr.mi-hogar.org";
const EVOLUTION_INSTANCE = "Adrian";
const EVOLUTION_API_KEY = "B81DB1EF3C9C-4353-8C2E-6CEB9D0C9464";

export interface WhatsAppMessageResult {
  success: boolean;
  error?: string;
}

/**
 * Replace template variables like {{nombre}}, {{email}}, {{whatsapp}}, {{ocupacion}}
 * with actual lead data.
 */
export function interpolateMessage(
  template: string,
  data: Record<string, string | null | undefined>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const firstName = data.name ? data.name.trim().split(/\s+/)[0] : null;

    const map: Record<string, string | null | undefined> = {
      nombre: firstName,
      email: data.email,
      whatsapp: data.phone,
      telefono: data.phone,
      ocupacion: data.occupation,
      recurso: data.resourceTitle,
    };
    return map[key.toLowerCase()] ?? `{{${key}}}`;
  });
}

/**
 * Send a WhatsApp text message using Evolution API.
 * @param phone - Recipient phone number (international format, e.g. "5491155551234")
 * @param text  - The message text to send
 */
export async function sendWhatsAppMessage(
  phone: string,
  text: string
): Promise<WhatsAppMessageResult> {
  // Clean the phone number – remove +, spaces, dashes, parentheses
  const cleanPhone = phone.replace(/[^0-9]/g, "");

  if (!cleanPhone || cleanPhone.length < 8) {
    return { success: false, error: "Número de teléfono inválido" };
  }

  try {
    const url = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: cleanPhone,
        text,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `Evolution API error (${response.status}):`,
        errorBody
      );
      return {
        success: false,
        error: `API error ${response.status}: ${errorBody.slice(0, 200)}`,
      };
    }

    const result = await response.json();
    console.log("Evolution API response:", JSON.stringify(result));
    return { success: true };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Error desconocido";
    console.error("Evolution API fetch error:", msg);
    return { success: false, error: msg };
  }
}
