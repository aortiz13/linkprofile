/**
 * WhatsApp AI Sales Agent
 * ─────────────────────────
 * Processes incoming WhatsApp messages, qualifies leads conversationally,
 * and guides them toward booking an asesoria with Adrian Ortiz.
 *
 * Uses OpenAI GPT-4o-mini with Adrian's voice profile for natural conversation.
 */

import OpenAI from "openai";
import { db } from "@/lib/db";
import {
  waConversations,
  waMessages,
  waLinkTokens,
  waAudioSnippets,
  leads,
  leadMagnets,
} from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { sendWhatsAppMessage, sendWhatsAppAudio } from "@/lib/evolution-api";
import { cancelNoReplyFollowups, resetNoReplyCount, scheduleNoReplyFollowups } from "@/lib/no-reply-followups";
import crypto from "crypto";

// ─── Config ──────────────────────────────────────────────────────────────────
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
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
- Si la persona no responde con mucho detalle, no seas invasivo. Seguí la conversación de forma natural.
- MÁXIMO UNA pregunta por mensaje. NUNCA hagas dos preguntas juntas.
- Mensajes CORTOS: máximo 2-3 líneas. Esto es WhatsApp, no un email. Sé directo y conciso.
- No uses listas ni bullet points. Escribí como en una conversación real de WhatsApp.

# AUDIOS
- Los mensajes del usuario pueden venir de audios transcritos, marcados con "[Audio transcrito]:". Tratá el contenido como un mensaje normal de texto, no menciones que fue transcrito.
- En algún momento durante la fase de discovery o qualification, podés invitar a la persona a mandar un audio si prefiere explicarse mejor. Ejemplo: "Si te resulta más fácil, mandame un audio contándome y te escucho 🎙️"
- Solo invitá a mandar audio UNA vez en la conversación, no insistas.
- Si el audio no se pudo procesar, pedí amablemente que lo reenvíe o escriba un texto.

# AUDIOS PRE-GRABADOS
- Tenés audios pre-grabados tuyos que podés enviar en momentos clave de la conversación.
- Para enviar un audio, incluí la acción "SEND_AUDIO:trigger_key" en el array de acciones.
- Enviá máximo UN audio por conversación. Usalo estratégicamente cuando genere más impacto que un texto.
- El audio se envía ANTES del mensaje de texto. El texto debe complementar el audio, no repetirlo.
- Los audios disponibles se listan al final de este prompt.

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
- actions: array de acciones. Posibles valores: "SEND_LINK" (enviar link de asesorías), "ESCALATE" (escalar a Adrian por tema precio), "SEND_AUDIO:trigger_key" (enviar audio pre-grabado)

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

  // 1.5. Check if opted out
  if (conversation.optedOut) {
    console.log(`[WA Agent] ${cleanPhone} opted out. Checking for reactivation...`);
    // Check if user wants to reactivate
    const lower = messageText.toLowerCase();
    if (lower.includes("quiero hablar") || lower.includes("quiero saber") || lower.includes("hola")) {
      await db.update(waConversations)
        .set({ optedOut: false, active: true, noReplyFollowups: 0, updatedAt: new Date() })
        .where(eq(waConversations.id, conversation.id));
      conversation = { ...conversation, optedOut: false, active: true, noReplyFollowups: 0 };
    } else {
      return; // Still opted out, ignore
    }
  }

  // 1.6. Cancel any pending no-reply follow-ups (user responded!)
  cancelNoReplyFollowups(cleanPhone);
  await resetNoReplyCount(conversation.id);

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

  // 4. Build OpenAI chat history
  const chatHistory: OpenAI.Chat.ChatCompletionMessageParam[] = history
    .slice(0, -1)
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  // 5. Build contextual user message
  const ctx = conversation.leadContext as Record<string, string> | null;
  let contextPrefix = "";
  if (chatHistory.length === 0 && ctx) {
    // First message — inject context
    contextPrefix = `[CONTEXTO INTERNO - NO mostrar al usuario: La persona se llama "${ctx.name || senderName || "desconocido"}", su ocupación es "${ctx.occupation || "no especificada"}", descargó el recurso "${ctx.resourceTitle || "recurso"}". Su email es ${ctx.email || "no disponible"}. Este es su PRIMER mensaje respondiendo a tu mensaje automatizado inicial.]\n\n`;
  }

  // 5.5. Load available audio snippets for the prompt
  const audioSnippets = await db
    .select({
      triggerKey: waAudioSnippets.triggerKey,
      name: waAudioSnippets.name,
      description: waAudioSnippets.description,
    })
    .from(waAudioSnippets)
    .where(eq(waAudioSnippets.active, true));

  let audioPromptSection = "";
  if (audioSnippets.length > 0) {
    audioPromptSection = `\n\n# AUDIOS DISPONIBLES\n${audioSnippets
      .map((a) => `- trigger_key: "${a.triggerKey}" | ${a.name}: ${a.description}`)
      .join("\n")}`;
  }

  // 6. Call OpenAI
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT + audioPromptSection },
    ...chatHistory,
    { role: "user", content: contextPrefix + messageText },
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.85,
    response_format: { type: "json_object" },
  });

  const responseText = completion.choices[0]?.message?.content || "";

  // 7. Parse the JSON response
  let agentResponse: AgentResponse;
  try {
    agentResponse = JSON.parse(responseText);
  } catch {
    console.error("[WA Agent] Failed to parse OpenAI response:", responseText);
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

      // Schedule a check in 10 minutes: if they didn't click, nudge them
      const convId = conversation.id;
      const convPhone = cleanPhone;
      setTimeout(async () => {
        try {
          await sendNoClickNudge(convId, convPhone);
        } catch (err) {
          console.error("[WA Agent] No-click nudge error:", err);
        }
      }, 10 * 60 * 1000); // 10 minutes
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

  // 9. Auto-send pre-recorded audio based on action/stage
  //    Map actions and stages to audio trigger keys
  let autoAudioTrigger: string | null = null;

  // Check LLM-requested audio first
  const audioAction = agentResponse.actions?.find((a) => a.startsWith("SEND_AUDIO:"));
  if (audioAction) {
    autoAudioTrigger = audioAction.replace("SEND_AUDIO:", "");
  }

  // Auto-trigger based on actions (higher priority)
  if (
    !autoAudioTrigger &&
    (agentResponse.actions?.includes("SEND_LINK") || agentResponse.message.includes("[ENVIAR_LINK]"))
  ) {
    autoAudioTrigger = "link_offer";
  }

  // Auto-trigger based on stage transitions (only on first message of that stage)
  if (!autoAudioTrigger && chatHistory.length === 0) {
    autoAudioTrigger = "greeting"; // First message ever
  }

  // Send the audio if we have a trigger
  let audioWasSent = false;
  if (autoAudioTrigger) {
    const [snippet] = await db
      .select()
      .from(waAudioSnippets)
      .where(and(eq(waAudioSnippets.triggerKey, autoAudioTrigger), eq(waAudioSnippets.active, true)))
      .limit(1);

    if (snippet) {
      const audioResult = await sendWhatsAppAudio(cleanPhone, snippet.audioBase64);
      if (audioResult.success) {
        console.log(`[WA Agent] Audio "${autoAudioTrigger}" sent to ${cleanPhone}`);
        audioWasSent = true;
        await db.insert(waMessages).values({
          conversationId: conversation.id,
          role: "assistant",
          content: `[Audio enviado: ${snippet.name}]`,
        });
        // Small delay so audio arrives before text
        await new Promise((r) => setTimeout(r, 2000));
      } else {
        console.error(`[WA Agent] Failed to send audio "${autoAudioTrigger}":`, audioResult.error);
      }
    }
  }

  // If audio was sent alongside the link, strip the LLM text and keep only the URL
  if (audioWasSent && autoAudioTrigger === "link_offer") {
    const urlMatch = finalMessage.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch) {
      finalMessage = `👉 ${urlMatch[1]}`;
    }
  }

  // 10. Send the text response via WhatsApp
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

  // 11. Handle OPT-OUT detection
  const lowerMsg = messageText.toLowerCase();
  const optOutPhrases = ["no me escribas", "no quiero recibir", "dejá de escribir", "no me contactes", "para de escribir", "basta", "no me mandes"];
  const isOptOut = optOutPhrases.some(p => lowerMsg.includes(p));

  if (isOptOut) {
    await db.update(waConversations)
      .set({ optedOut: true, active: false, updatedAt: new Date() })
      .where(eq(waConversations.id, conversation.id));
    cancelNoReplyFollowups(cleanPhone);

    const optOutReply = "Listo, no te voy a molestar más. Si en algún momento querés retomar la charla, mandame un mensaje y con gusto te ayudo. Éxitos! 🙌";
    await sendWhatsAppMessage(cleanPhone, optOutReply);
    await db.insert(waMessages).values({ conversationId: conversation.id, role: "assistant", content: optOutReply });
    console.log(`[WA Agent] ${cleanPhone} opted out.`);
    return;
  }

  // 12. Update conversation state
  const leadCtx = conversation.leadContext as Record<string, string> | null;
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
      lastAgentMessageAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(waConversations.id, conversation.id));

  // 13. Schedule no-reply follow-ups
  scheduleNoReplyFollowups(cleanPhone, conversation.id, leadCtx?.country || null);

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

// ─── Send nudge when link was NOT clicked after 10 minutes ───────────────────
async function sendNoClickNudge(conversationId: string, phone: string) {
  // Check if the link was already clicked
  const [conv] = await db
    .select()
    .from(waConversations)
    .where(eq(waConversations.id, conversationId))
    .limit(1);

  if (!conv || !conv.active) return;

  // If they already clicked, don't nudge (the click follow-up handles it)
  if (conv.linkClickedAt) {
    console.log(`[WA Agent] Link already clicked for ${phone}, skipping nudge.`);
    return;
  }

  const ctx = conv.leadContext as Record<string, string> | null;
  const firstName = ctx?.name ? ctx.name.trim().split(/\s+/)[0] : "";

  const nudgeMessage = firstName
    ? `${firstName}, pudiste ver la info que te envié? 🙂`
    : `Pudiste ver la info que te envié? 🙂`;

  const result = await sendWhatsAppMessage(phone, nudgeMessage);

  if (result.success) {
    // Store the nudge message in memory
    await db.insert(waMessages).values({
      conversationId,
      role: "assistant",
      content: nudgeMessage,
    });

    console.log(`[WA Agent] No-click nudge sent to ${phone}`);
  }
}
