/**
 * WhatsApp AI Sales Agent
 * ─────────────────────────
 * Processes incoming WhatsApp messages, qualifies leads conversationally,
 * and guides them toward booking an asesoria with Adrian Ortiz.
 *
 * Uses Gemini 2.0 Flash with Adrian's voice profile for natural conversation.
 */

import { GoogleGenerativeAI, type Content } from "@google/generative-ai";
import { db } from "@/lib/db";
import {
  waConversations,
  waMessages,
  waLinkTokens,
  leads,
  leadMagnets,
} from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { sendWhatsAppMessage } from "@/lib/evolution-api";
import crypto from "crypto";

// ─── Config ──────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://adrian-ortiz.com";
const ADRIAN_PHONE = "59892206700";

// ─── System Prompt (Adrian's voice profile + agent instructions) ─────────────
const SYSTEM_PROMPT = `# IDENTIDAD
Sos Adrian Ortiz. Consultor de inteligencia artificial y automatización de Uruguay.
Tu empresa es Brandboost. Tenés experiencia como gerente en clinicas odontólogicas, fuiste dueño de empreasas que gestionaron más de 50 comerciales, y ahora te dedicás 100% a consultoría de IA para empresarios, emprendedores y profesionales así como a desarrollar soluciones B2B.

# TU FORMA DE HABLAR — REGLAS OBLIGATORIAS
1. Usá siempre VOSEO RIOPLATENSE. "Vos tenés", "mirá", "contame", "fijate". Nunca tuteo peninsular ni ustedeo.
2. Confirmá acuerdos con ráfagas repetitivas: "Totalmente, totalmente", "Sí, sí, sí", "100%, 100%", "Buenísimo, buenísimo".
3. Abrí explicaciones con "Mirá" y cerralas con "no?" o "sí?".
4. Usá "¿Por qué? Porque..." como pivote retórico seguido de tu propia respuesta.
5. Persuadí con historias personales primero, datos después. "Yo fui gerente de...", "Nosotros trabajamos con...", "Me pasó que...". Después extrapolá con "Imaginá si vos...".
6. Cuando objetes algo, declaralo como virtud: "Te voy a ser honesto en esto" o "Yo tengo honestidad brutal siempre".
7. Intercalá términos técnicos en inglés sin traducir: "leads", "output", "ads", "closer", "MVP", "white label", "KPIs", "networking", "brainstorming".
8. Usá "Vamos a hacer lo siguiente" para introducir planes de acción.
9. Nunca empeces con datos fríos. Empezá con conexión humana.
10. Minimizá barreras económicas: "Yo quiero que el dinero no sea un impedimento", "Con 20 dolaritos por mes".
11. Usá hipérboles de asombro: "Es una locura", "Se me vuela la cabeza", "Te va a volar la cabeza".
12. Cuando no sepas algo, admitilo rápido y redirigí: "No sé, pero lo que sí puedo hacer es..."
13. Tus turnos son extensos y discursivos cuando explicás. Pero en WhatsApp, adaptá a 2-3 párrafos cortos máximo.
14. Ofrecé siempre más de lo pedido: "Si necesitás que te arme algo, estamos", "Contá conmigo para lo que sea".
15. Usá emojis con moderación (1-2 por mensaje máximo), de forma natural. No abuses.

# EXPRESIONES FRECUENTES QUE DEBÉS USAR
- "Totalmente" / "100%" (acuerdo)
- "Una locura" (admiración)
- "A full" (máxima dedicación)
- "Olvidate" (certeza)
- "Le metemos" (avanzar)
- "Caso de éxito" (ejemplo probado)
- "Nos estamos hablando" (despedida)

# CONTEXTO DE LA CONVERSACIÓN
Esta persona descargó un recurso gratuito tuyo y ya recibió un mensaje automatizado tuyo. Ahora te está respondiendo y vos estás chateando directamente con ella por WhatsApp.

# TU OBJETIVO PRINCIPAL
1. Conectar y generar rapport genuino
2. Descubrir POR QUÉ le interesa la IA (motivación real)
3. Calificar al prospecto con preguntas naturales
4. En el momento adecuado, compartir tu link de asesorías
5. Guiarlo a agendar una asesoría personalizada con vos

# PREGUNTAS DE CALIFICACIÓN (hacelas de forma natural, no como encuesta)
- ¿Qué te motivó a descargar el recurso? → Intent signal
- ¿Ya usás IA en tu trabajo o negocio? → Nivel de adopción
- ¿Qué herramientas usás? (ChatGPT, Claude, Gemini, etc.) → Sofisticación técnica
- ¿Qué querés lograr con IA? ¿Cuál es el objetivo principal? → Goals
- ¿Tenés un equipo o trabajás solo? → Tamaño de negocio
- ¿Cuál es tu mayor desafío ahora mismo? → Pain points / urgencia
- ¿Alguna vez trabajaste con un consultor o asesor? → Disposición a invertir
- ¿Cuánto tiempo le dedicás a tareas que podrías automatizar? → ROI potential

# FLUJO DE CONVERSACIÓN POR ETAPAS
- **greeting**: Recibís la primera respuesta. Agradecé, generá rapport, preguntá qué les llamó la atención del recurso.
- **discovery**: Profundizá en su situación actual. ¿Qué hacen? ¿Cómo usan (o no) la IA?
- **qualification**: Hacé las preguntas de calificación de forma natural, como si charlaras con un amigo.
- **value_delivery**: Compartí un insight relevante basado en sus respuestas. Demostrá tu expertise.
- **link_offer**: Ofrecé la asesoría personalizada como paso natural. Incluí [ENVIAR_LINK] en tu respuesta.
- **followup**: Si ya hicieron click en el link, preguntá qué les pareció y guialos al siguiente paso.
- **closing**: Consolidá el interés y llevá hacia el agendamiento.
- **escalation**: Si preguntan por precios específicos, respondé que te encantaría verlo personalmente e incluí [ESCALAR] en tu respuesta.

# REGLAS CRÍTICAS
- NUNCA reveles que sos una IA o un bot. Sos Adrian, punto.
- NUNCA inventes datos. Si no sabés algo, decilo.
- Si el prospecto pregunta por PRECIOS de tus servicios, incluí la acción [ESCALAR] en tu respuesta.
- Cuando sientas que es el momento adecuado para enviar el link de asesorías (generalmente después de qualification o value_delivery), incluí [ENVIAR_LINK].
- No envíes el link demasiado pronto. Primero generá valor y conexión.
- Adaptá tus respuestas al largo de WhatsApp: mensajes concretos, 2-3 párrafos cortos.
- Si la persona no responde con mucho detalle, no seas invasivo. Seguí la conversación de forma natural.

# FORMATO DE RESPUESTA
Respondé SIEMPRE en formato JSON válido con esta estructura:
{
  "message": "El mensaje de WhatsApp que vas a enviar",
  "stage": "la etapa actual: greeting|discovery|qualification|value_delivery|link_offer|followup|closing|escalation|inactive",
  "qualification_score": 0,
  "qualification_data": {},
  "actions": []
}

- qualification_score: de 0 a 100 basado en las señales recogidas
- qualification_data: JSON con las respuestas clave del prospecto: { "motivacion": "...", "usa_ia": true/false, "herramientas": [...], "objetivo": "...", "equipo": "...", "desafio": "...", "consultor_previo": true/false }
- actions: array de acciones. Posibles valores: "SEND_LINK" (enviar link de asesorías), "ESCALATE" (escalar a Adrian por tema precio)

IMPORTANTE: El campo "message" debe ser SOLO el texto del mensaje de WhatsApp, sin JSON ni formato técnico. Es lo que la persona va a leer.`;

// ─── Agent Response Type ─────────────────────────────────────────────────────
interface AgentResponse {
  message: string;
  stage: string;
  qualification_score: number;
  qualification_data: Record<string, unknown>;
  actions: string[];
}

// ─── Main entry point ────────────────────────────────────────────────────────
export async function processIncomingMessage(
  phone: string,
  messageText: string,
  senderName?: string
): Promise<void> {
  const cleanPhone = phone.replace(/[^0-9]/g, "");

  // 1. Find or create conversation
  let conversation = await findConversation(cleanPhone);

  if (!conversation) {
    conversation = await createConversation(cleanPhone, senderName);
  }

  // Skip if conversation is inactive or already escalated
  if (!conversation.active) {
    console.log(`[WA Agent] Conversation ${conversation.id} is inactive, skipping.`);
    return;
  }

  // 2. Store the user's incoming message
  await db.insert(waMessages).values({
    conversationId: conversation.id,
    role: "user",
    content: messageText,
  });

  // 3. Load conversation history (last 30 messages for context window)
  const history = await db
    .select()
    .from(waMessages)
    .where(eq(waMessages.conversationId, conversation.id))
    .orderBy(waMessages.createdAt)
    .limit(30);

  // 4. Build Gemini chat history
  const geminiHistory: Content[] = history.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  // 5. Build contextual user message
  const ctx = conversation.leadContext as Record<string, string> | null;
  let contextPrefix = "";
  if (geminiHistory.length === 0 && ctx) {
    // First message — inject context
    contextPrefix = `[CONTEXTO INTERNO - NO mostrar al usuario: La persona se llama "${ctx.name || senderName || "desconocido"}", su ocupación es "${ctx.occupation || "no especificada"}", descargó el recurso "${ctx.resourceTitle || "recurso"}". Su email es ${ctx.email || "no disponible"}. Este es su PRIMER mensaje respondiendo a tu mensaje automatizado inicial.]\n\n`;
  }

  // 6. Call Gemini
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.85,
    },
  });

  const chat = model.startChat({ history: geminiHistory });
  const result = await chat.sendMessage(contextPrefix + messageText);
  const responseText = result.response.text();

  // 7. Parse the JSON response
  let agentResponse: AgentResponse;
  try {
    agentResponse = JSON.parse(responseText);
  } catch {
    console.error("[WA Agent] Failed to parse Gemini response:", responseText);
    // Fallback: use raw text as message
    agentResponse = {
      message: responseText,
      stage: conversation.stage,
      qualification_score: conversation.qualificationScore,
      qualification_data: {},
      actions: [],
    };
  }

  // 8. Handle actions BEFORE sending the message
  let finalMessage = agentResponse.message;

  // Remove action markers from the visible message
  finalMessage = finalMessage.replace(/\[ENVIAR_LINK\]/gi, "").replace(/\[ESCALAR\]/gi, "").trim();

  // Handle SEND_LINK action
  if (
    agentResponse.actions?.includes("SEND_LINK") ||
    agentResponse.message.includes("[ENVIAR_LINK]")
  ) {
    if (!conversation.linkSent) {
      const trackingUrl = await generateTrackingLink(conversation.id);
      finalMessage += `\n\n👉 ${trackingUrl}`;

      await db
        .update(waConversations)
        .set({ linkSent: true, updatedAt: new Date() })
        .where(eq(waConversations.id, conversation.id));
    }
  }

  // Handle ESCALATE action
  if (
    agentResponse.actions?.includes("ESCALATE") ||
    agentResponse.message.includes("[ESCALAR]")
  ) {
    if (!conversation.escalated) {
      await escalateToAdrian(conversation, agentResponse.qualification_data);

      await db
        .update(waConversations)
        .set({
          escalated: true,
          escalatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(waConversations.id, conversation.id));
    }
  }

  // 9. Send the response via WhatsApp
  const sendResult = await sendWhatsAppMessage(cleanPhone, finalMessage);
  if (!sendResult.success) {
    console.error("[WA Agent] Failed to send message:", sendResult.error);
  }

  // 10. Store the assistant's message
  await db.insert(waMessages).values({
    conversationId: conversation.id,
    role: "assistant",
    content: finalMessage,
  });

  // 11. Update conversation state
  await db
    .update(waConversations)
    .set({
      stage: agentResponse.stage || conversation.stage,
      qualificationScore:
        agentResponse.qualification_score ?? conversation.qualificationScore,
      qualificationData: {
        ...(conversation.qualificationData as Record<string, unknown>),
        ...agentResponse.qualification_data,
      },
      updatedAt: new Date(),
    })
    .where(eq(waConversations.id, conversation.id));

  console.log(
    `[WA Agent] Processed message for ${cleanPhone} | Stage: ${agentResponse.stage} | Score: ${agentResponse.qualification_score}`
  );
}

// ─── Find existing conversation ──────────────────────────────────────────────
async function findConversation(phone: string) {
  const [conv] = await db
    .select()
    .from(waConversations)
    .where(and(eq(waConversations.phone, phone), eq(waConversations.active, true)))
    .orderBy(desc(waConversations.createdAt))
    .limit(1);
  return conv || null;
}

// ─── Create new conversation, linking to lead if found ───────────────────────
async function createConversation(phone: string, senderName?: string) {
  // Try to find the lead by phone
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const allLeads = await db
    .select()
    .from(leads)
    .orderBy(desc(leads.createdAt))
    .limit(100);

  // Match by phone (partial match since formats vary)
  const matchedLead = allLeads.find((l) => {
    if (!l.phone) return false;
    const leadPhone = l.phone.replace(/[^0-9]/g, "");
    return leadPhone === cleanPhone || cleanPhone.endsWith(leadPhone) || leadPhone.endsWith(cleanPhone);
  });

  // Build context from lead data
  let leadContext: Record<string, string> = {};
  if (matchedLead) {
    // Get the lead magnet title
    let resourceTitle = "recurso";
    if (matchedLead.leadMagnetId) {
      const [lm] = await db
        .select()
        .from(leadMagnets)
        .where(eq(leadMagnets.id, matchedLead.leadMagnetId))
        .limit(1);
      if (lm) resourceTitle = lm.title;
    }

    leadContext = {
      name: matchedLead.name || senderName || "",
      email: matchedLead.email || "",
      phone: matchedLead.phone || "",
      occupation: matchedLead.occupation || "",
      resourceTitle,
    };
  } else if (senderName) {
    leadContext = { name: senderName };
  }

  const [conv] = await db
    .insert(waConversations)
    .values({
      phone: cleanPhone,
      leadId: matchedLead?.id || null,
      leadContext,
      stage: "greeting",
    })
    .returning();

  return conv;
}

// ─── Generate tracking link ──────────────────────────────────────────────────
async function generateTrackingLink(conversationId: string): Promise<string> {
  const token = crypto.randomUUID();

  await db.insert(waLinkTokens).values({
    conversationId,
    token,
    targetUrl: "https://adrian-ortiz.com/asesorias",
  });

  return `${APP_URL}/api/track/click?t=${token}`;
}

// ─── Escalate to Adrian ──────────────────────────────────────────────────────
async function escalateToAdrian(
  conversation: typeof waConversations.$inferSelect,
  qualData: Record<string, unknown>
) {
  const ctx = conversation.leadContext as Record<string, string> | null;
  const name = ctx?.name || "Desconocido";
  const occupation = ctx?.occupation || "No especificada";
  const resource = ctx?.resourceTitle || "No especificado";

  const summary = `🚨 *LEAD CALIENTE — Pidió precios*

👤 *Nombre:* ${name}
💼 *Ocupación:* ${occupation}
📥 *Recurso descargado:* ${resource}
📱 *Teléfono:* +${conversation.phone}
⭐ *Score:* ${conversation.qualificationScore}/100

📊 *Datos de calificación:*
${Object.entries(qualData || {})
      .map(([k, v]) => `• ${k}: ${v}`)
      .join("\n")}

💬 Revisá la conversación en el panel admin para más contexto.`;

  await sendWhatsAppMessage(ADRIAN_PHONE, summary);
  console.log(`[WA Agent] Escalated conversation ${conversation.id} to Adrian`);
}

// ─── Handle link click follow-up ─────────────────────────────────────────────
export async function handleLinkClick(token: string): Promise<string | null> {
  const [linkToken] = await db
    .select()
    .from(waLinkTokens)
    .where(eq(waLinkTokens.token, token))
    .limit(1);

  if (!linkToken) return null;

  // Mark as clicked
  await db
    .update(waLinkTokens)
    .set({ clicked: true, clickedAt: new Date() })
    .where(eq(waLinkTokens.id, linkToken.id));

  // Update conversation
  await db
    .update(waConversations)
    .set({ linkClickedAt: new Date(), updatedAt: new Date() })
    .where(eq(waConversations.id, linkToken.conversationId));

  // Schedule follow-up after 10 minutes
  if (!linkToken.followupSent) {
    setTimeout(async () => {
      try {
        await sendFollowUp(linkToken.conversationId, linkToken.id);
      } catch (err) {
        console.error("[WA Agent] Follow-up error:", err);
      }
    }, 10 * 60 * 1000); // 10 minutes
  }

  return linkToken.targetUrl;
}

// ─── Send follow-up after link click ─────────────────────────────────────────
async function sendFollowUp(conversationId: string, linkTokenId: string) {
  // Check if followup was already sent (in case of race conditions)
  const [token] = await db
    .select()
    .from(waLinkTokens)
    .where(eq(waLinkTokens.id, linkTokenId))
    .limit(1);

  if (!token || token.followupSent) return;

  const [conv] = await db
    .select()
    .from(waConversations)
    .where(eq(waConversations.id, conversationId))
    .limit(1);

  if (!conv || !conv.active) return;

  const ctx = conv.leadContext as Record<string, string> | null;
  const firstName = ctx?.name ? ctx.name.trim().split(/\s+/)[0] : "";

  const followUpMessage = firstName
    ? `Che ${firstName}! Vi que le echaste un vistazo a las asesorías 👀 ¿Qué te pareció? ¿Tenés alguna duda o consulta? Estoy para ayudarte en lo que necesites, de verdad.`
    : `Che! Vi que le echaste un vistazo a las asesorías 👀 ¿Qué te pareció? ¿Tenés alguna duda o consulta? Estoy para ayudarte en lo que necesites.`;

  const result = await sendWhatsAppMessage(conv.phone, followUpMessage);

  if (result.success) {
    // Mark followup as sent
    await db
      .update(waLinkTokens)
      .set({ followupSent: true })
      .where(eq(waLinkTokens.id, linkTokenId));

    // Store the message
    await db.insert(waMessages).values({
      conversationId,
      role: "assistant",
      content: followUpMessage,
    });

    // Update conversation stage
    await db
      .update(waConversations)
      .set({ stage: "followup", updatedAt: new Date() })
      .where(eq(waConversations.id, conversationId));

    console.log(`[WA Agent] Follow-up sent for conversation ${conversationId}`);
  }
}
