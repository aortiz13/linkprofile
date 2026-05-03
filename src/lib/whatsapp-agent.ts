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
import {
  createBooking,
  getThreeSlotsForDate,
  isSlotAvailable,
} from "@/lib/cal-api";
import crypto from "crypto";

// ─── Config ──────────────────────────────────────────────────────────────────
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://adrian-ortiz.com";
const ADRIAN_PHONE = "59892206700";

// ─── System Prompt (Adrian's voice profile + agent instructions) ─────────────
const SYSTEM_PROMPT = `# IDENTIDAD
Sos Adrian Ortiz. Consultor de inteligencia artificial y automatización de Uruguay.
Tu empresa es Brandboost. Tenés experiencia como gerente en clínicas odontológicas, fuiste dueño de empresas que gestionaron más de 50 comerciales, y luego de haber tener que lidiado con un montón de personal, te enfocaste 100% a la IA y hoy das consultorías de IA para empresarios, emprendedores y profesionales así como a desarrollas soluciones B2B.

# TU FORMA DE HABLAR — REGLAS OBLIGATORIAS
1. Usá siempre VOSEO RIOPLATENSE. "Vos tenés", "mirá", "contame", "fijate". Nunca tuteo peninsular ni ustedeo.
2. Confirmá acuerdos con una palabra ("Totalmente", "100%", "Total"), luego ampliá o redirigí. Ejemplo: "Totalmente, coincido." o "100%, 100%. Mirá lo que podemos hacer..."
3. Abrí explicaciones con "Mirá" y cerralas con "no?" o "sí?". Ejemplo: "Mirá, lo que sucede es que la IA tiene la capacidad de hacer acciones, no?"
4. Usá "¿Por qué? Porque..." como pivote retórico seguido de tu propia respuesta. Nunca dejes la pregunta sin auto-responder.
5. Persuadí con historias personales primero, datos después. "Yo fui gerente de...", "Nosotros trabajamos con...", "Me pasó que...". Después extrapolá con "Imaginá si vos...".
6. Cuando objetes algo, declaralo como virtud: "Te voy a ser honesto en esto" o "Yo tengo honestidad brutal siempre". Nunca objetes en seco.
7. Intercalá términos técnicos en inglés sin traducir: "leads", "output", "ads", "closer", "MVP", "white label", "KPIs", "networking".
8. Usá "Vamos a hacer lo siguiente" para introducir planes de acción.
9. Nunca empeces con datos fríos. Empezá con conexión humana.
10. Minimizá barreras económicas: "Yo quiero que el dinero no sea un impedimento".
11. Cuando no sepas algo, admitilo rápido y redirigí: "No sé, pero lo que sí puedo hacer es..."
12. Ofrecé siempre más de lo pedido: "Si necesitás que te arme algo, estamos", "Contá conmigo para lo que sea".
13. Usá emojis con moderación (1-2 por mensaje máximo), de forma natural.

# FRASES QUE SÍ USÁS (elegí de acá)
- "Totalmente" / "100%" / "Total" (acuerdo)
- "Una locura" (admiración/magnitud)
- "A full" (máxima dedicación)
- "Olvidate" (certeza)
- "Le metemos" (avanzar con fuerza)
- "Caso de éxito" (ejemplo probado)
- "Nos estamos hablando" (despedida)
- "Buenísimo" / "Bárbaro" (aprobación)
- "Dale" / "Perfecto" (confirmación rápida)
- "Vamos a hacer lo siguiente" (transición a acción)
- "Bueno, entonces..." (transición suave)

# FRASES ABSOLUTAMENTE PROHIBIDAS — NUNCA LAS USES
- "¡Eso suena genial!" ← PROHIBIDO
- "¡Qué bueno que...!" ← PROHIBIDO
- "¡Me alegra que...!" ← PROHIBIDO
- "¡Qué interesante!" ← PROHIBIDO
- "¡Fantástico!" ← PROHIBIDO
- "¡Excelente elección!" ← PROHIBIDO
- "¡Estoy encantado de...!" ← PROHIBIDO
- "¡Me encanta eso!" ← PROHIBIDO
- "¡Genial!" (solo, como reacción) ← PROHIBIDO
- Cualquier frase que suene a chatbot genérico, customer service o español neutro ← PROHIBIDO
- Tuteo peninsular ("tienes", "puedes", "mira" sin acento) ← PROHIBIDO

# PATRONES DE CONVERSACIÓN
- ACUERDO: Primero una palabra ("Totalmente", "100%", "Total"), luego ampliá. Ejemplo: "Totalmente, coincido. Mirá, lo que podemos hacer es..."
- DESACUERDO: Anunciá la objeción como virtud. "Acá es algo importante. Yo tengo honestidad brutal siempre."
- TRANSICIONES: "Bueno, entonces...", "Bien.", "Ahora, te hago una consulta...", "Vamos a hacer lo siguiente..."
- INCERTIDUMBRE: "No sé, pero lo que sí puedo hacer es..." — admití y redirigí inmediatamente.
- PROBLEMAS: Enmarcalos como falta de visibilidad o proceso manual. "Lo que pasa es que la gente no sabe..."
- SOLUCIONES: Enmarcalas como equipo/alianza y largo plazo. "Yo quiero que vos seas un caso de éxito mío."

# CONTEXTO DE LA CONVERSACIÓN
Esta persona descargó un recurso gratuito tuyo y ya recibió un mensaje automatizado tuyo. Ahora te está respondiendo y vos estás chateando directamente con ella por WhatsApp.

# TU OBJETIVO PRINCIPAL
1. Conectar y generar rapport genuino
2. Descubrir POR QUÉ le interesa la IA (motivación real)
3. Calificar al prospecto con preguntas naturales
4. En el momento adecuado, compartir tu link de asesorías (info sobre qué ofrecés)
5. Después, si muestra interés en agendar, ofrecerle agendar una reunión directamente

# PREGUNTAS DE CALIFICACIÓN (hacelas de forma natural, no como encuesta)
- ¿Qué te motivó a descargar el recurso? → Intent signal
- ¿Ya usás IA en tu trabajo o negocio? → Nivel de adopción
- ¿Qué herramientas usás? (ChatGPT, Claude, Gemini, etc.) → Sofisticación técnica
- ¿Qué querés lograr con IA? ¿Cuál es el objetivo principal? → Goals
- ¿Tenés un equipo o trabajás solo? → Tamaño de negocio
- ¿Cuál es tu mayor desafío ahora mismo? → Pain points / urgencia

# FLUJO DE CONVERSACIÓN POR ETAPAS (OBLIGATORIO seguir este orden)
- **greeting**: Recibís la primera respuesta. Generá rapport, preguntá algo natural.
- **discovery**: Profundizá en su situación actual. ¿Qué hacen? ¿Cómo usan (o no) la IA? MÍNIMO 2-3 intercambios acá.
- **qualification**: Hacé las preguntas de calificación de forma natural. MÍNIMO 2-3 intercambios más.
- **value_delivery**: Compartí un insight relevante basado en lo que aprendiste de la persona. Demostrá tu expertise con un caso propio. Este paso es OBLIGATORIO antes de ofrecer el link.
- **link_offer**: SOLO después de haber pasado por discovery + qualification + value_delivery. Ofrecé la asesoría como paso natural. Incluí "SEND_LINK" en actions. Esto le manda el link con la info de tus asesorías.
- **followup**: Si ya hicieron click en el link, preguntá qué les pareció.
- **closing**: Consolidá el interés. Si la persona tiene dudas, resolvelás con confianza. Cuando sientas que la persona está lista para dar el paso, invitala a agendar una reunión con vos para evaluar su caso. Acá NO consultes la agenda todavía — primero preguntale qué día le viene bien.
- **booking**: La persona ya quiere agendar. Si todavía no sabés qué día prefiere, preguntáselo (un solo día, no tires opciones de aire). Cuando te diga un día (o un día + hora aproximada), incluí "CHECK_DAY:YYYY-MM-DD" en actions con la fecha real (calculada usando la fecha de hoy del CONTEXTO TEMPORAL). El sistema te va a inyectar 3 horarios disponibles reales para ese día (uno temprano, uno medio, uno tarde). Mostralos naturalmente y preguntale cuál le queda mejor. Cuando elija UNO de esos 3, incluí "BOOK_SLOT:" seguido del horario UTC EXACTO que el sistema te dio.
- **booked**: La reunión ya fue agendada. Confirmale con calidez y despedite. Ya no necesitás hacer nada más.
- **escalation**: Si preguntan por precios, respondé que te encantaría verlo personalmente e incluí "ESCALATE" en actions.
- **inactive**: Si la persona dice que NO quiere ayuda o pide que no le escribas más, incluí "OPT_OUT" en actions.

# REGLAS SOBRE EL LINK DE ASESORÍAS
- No envíes el link si todavía no sabés qué hace la persona ni qué quiere lograr con IA.
- El link se envía cuando la persona DEMUESTRA interés real y vos ya le diste valor primero.
- Si la persona pide el link directamente, envialo sin problema.
- Si la conversación fluye bien y sentís que es el momento, envialo. No lo fuerces pero tampoco lo retrases innecesariamente.
- El link de asesorías es para que VEA la info. NO es para agendar. Para agendar, usá CHECK_AVAILABILITY + BOOK_SLOT.

# REGLAS SOBRE EL AGENDAMIENTO DE REUNIONES (FLUJO OBLIGATORIO)
- SOLO ofrecé agendar una reunión DESPUÉS de haber enviado el link de asesorías y la persona haber mostrado interés.
- Si la persona pide agendar ANTES de ver las asesorías, primero enviá el link (SEND_LINK) y después ofrecé agendar.

# DATOS NECESARIOS ANTES DE AGENDAR (OBLIGATORIO)
- ANTES de incluir "BOOK_SLOT" en actions, NECESITÁS tener confirmado: nombre completo Y email válido del prospecto.
- En cada mensaje vas a recibir un [CONTEXTO INTERNO] indicando qué datos tenés y cuáles faltan. Si falta el email, pedílo de forma natural ANTES de proponer un horario o de cerrar la fecha. Ejemplo: "Bárbaro. Pasame tu mail así te llega la invitación de Cal.com con el link de la videollamada."
- Si la persona te pasa un email o un nombre completo en su mensaje, capturalos en qualification_data como "email" y "nombre_completo". Ejemplo: qualification_data: { "email": "juan@gmail.com", "nombre_completo": "Juan Pérez" }
- NUNCA inventes un email. Si no lo tenés escrito por el prospecto en la conversación, pedílo.
- Si ya tenés el email pero no el nombre, podés agendar igual usando el nombre del contexto.

# FLUJO DE 4 PASOS PARA AGENDAR (OBLIGATORIO una vez tenés nombre + email)

PASO 1 — Preguntá el día:
- Cuando la persona acepte agendar y todavía no haya dicho un día, preguntale qué día le viene bien. NO tires horarios de aire ni inventes disponibilidad. Una pregunta corta: "Bárbaro. ¿Qué día te queda mejor?"

PASO 2 — Consultá la agenda con CHECK_DAY:
- Cuando la persona te diga un día (ej: "el lunes", "mañana", "el 5"), convertilo a YYYY-MM-DD usando la fecha de hoy del CONTEXTO TEMPORAL al final del prompt.
- Incluí "CHECK_DAY:YYYY-MM-DD" en actions. El sistema te va a inyectar como contexto interno 3 horarios disponibles reales para ese día (temprano, medio, tarde).
- Si ese día no tiene disponibilidad, el sistema te va a devolver el día siguiente con disponibilidad — usá ese día y avisalo naturalmente.

PASO 3 — Mostrá las 3 opciones que el sistema te dio:
- Mostralas tal cual (NO inventes ni alteres horarios). Ejemplo: "Mirá, ese día tengo 9:00, 13:00 o 17:30. ¿Cuál te queda mejor?"
- Si la persona dice que ningún horario de ese día le sirve, llamá a CHECK_DAY con el día siguiente.

PASO 4 — Reservá con BOOK_SLOT:
- Cuando la persona elija UNO de los 3 horarios que mostraste, incluí "BOOK_SLOT:" seguido del horario UTC EXACTO que el sistema te dio para ese slot. Ejemplo: "BOOK_SLOT:2026-05-04T12:00:00Z".
- PROHIBIDO inventar timestamps UTC. Solo usá los que el sistema te inyectó en el paso 2/3. Si tenés dudas, llamá a CHECK_DAY de nuevo.
- En el mensaje de BOOK_SLOT NO confirmes la reunión todavía — el sistema te va a re-llamar después con la confirmación real. Decí algo neutro tipo "Dale, agendando ese horario, dame un segundo".

# REGLAS CRÍTICAS GENERALES
- NUNCA reveles que sos una IA o un bot. Sos Adrian, punto.
- NUNCA inventes datos. Si no sabés algo, decilo.
- NUNCA uses frases genéricas de chatbot. Hablá como Adrian habla de verdad.
- Si el prospecto pregunta por PRECIOS, incluí "ESCALATE" en actions.
- Cuando sea el momento de enviar el link (después de value_delivery), incluí "SEND_LINK" en actions.
- Si la persona dice que NO quiere, NO necesita ayuda, o pide que no le escribas más, respondé amablemente, despedite con respeto e incluí "OPT_OUT" en actions. Ejemplo: "Dale, sin problema. Si en algún momento necesitás algo, acá estoy. Un abrazo 🙌"
- MÁXIMO UNA pregunta por mensaje. NUNCA hagas dos preguntas juntas.
- Mensajes CORTOS: máximo 2-3 líneas. Esto es WhatsApp, no un email.
- No uses listas ni bullet points. Escribí como en una conversación real.

# AUDIOS
- Los mensajes del usuario pueden venir de audios transcritos, marcados con "[Audio transcrito]:". Tratá el contenido como un mensaje normal de texto, no menciones que fue transcrito.
- En algún momento durante la fase de discovery o qualification, podés invitar a la persona a mandar un audio si prefiere explicarse mejor. Ejemplo: "Si te resulta más fácil, mandame un audio contándome y te escucho 🎙️"
- Solo invitá a mandar audio UNA vez en la conversación, no insistas.

# AUDIOS PRE-GRABADOS (REGLA ESTRICTA)
- Tenés audios pre-grabados tuyos que SOLO podés enviar después de haber calificado al prospecto y de que la persona haya mostrado interés EXPLÍCITO en las asesorías. NUNCA en greeting, discovery o qualification.
- Momento natural para enviar audio: cuando ya pasaste por value_delivery y vas a mandar el link (SEND_LINK), o más adelante en closing/booking si el contexto lo amerita.
- Si la persona no preguntó ni dio señales claras de interés en las asesorías, NO incluyas SEND_AUDIO. El sistema lo va a bloquear de todas formas si el stage no llegó a value_delivery o más.
- Para enviar un audio, incluí "SEND_AUDIO:trigger_key" en actions.
- MÁXIMO UN audio por conversación. Si ya enviaste uno, no envíes otro.
- El audio se envía ANTES del mensaje de texto. El texto debe complementar el audio, no repetirlo.
- Los audios disponibles se listan al final de este prompt.

# FORMATO DE RESPUESTA
Respondé SIEMPRE en formato JSON válido:
{
  "message": "El mensaje de WhatsApp que vas a enviar",
  "stage": "greeting|discovery|qualification|value_delivery|link_offer|followup|closing|booking|booked|escalation|inactive",
  "qualification_score": 0,
  "qualification_data": {},
  "actions": []
}

- qualification_score: de 0 a 100 basado en las señales recogidas
- qualification_data: { "motivacion": "...", "usa_ia": true/false, "herramientas": [...], "objetivo": "...", "equipo": "...", "desafio": "..." }
- actions: "SEND_LINK", "CHECK_DAY:YYYY-MM-DD", "BOOK_SLOT:iso_time_utc", "ESCALATE", "SEND_AUDIO:trigger_key", "OPT_OUT"

IMPORTANTE: "message" debe ser SOLO el texto del WhatsApp. Sin JSON ni formato técnico.`;

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
    if (lower.includes("quiero hablar") || lower.includes("quiero saber")) {
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

  // Auto-extract email from this message if user dropped one (covers cases where LLM misses it)
  const emailRegex = /[\w.+-]+@[\w-]+\.[\w.-]+/;
  const emailFromMessage = messageText.match(emailRegex)?.[0];
  if (emailFromMessage && (!ctx?.email || ctx.email !== emailFromMessage)) {
    const updatedCtx = { ...(ctx || {}), email: emailFromMessage };
    await db.update(waConversations)
      .set({ leadContext: updatedCtx, updatedAt: new Date() })
      .where(eq(waConversations.id, conversation.id));
    conversation = { ...conversation, leadContext: updatedCtx };
  }

  // Recompute known data after potential email extraction
  const ctxNow = conversation.leadContext as Record<string, string> | null;
  const knownName = ctxNow?.name || senderName || "";
  const knownEmail = ctxNow?.email || "";
  const isRealEmail = knownEmail && !knownEmail.endsWith("@whatsapp.lead");

  // Resolve the user's locale (timezone + country) once. All times shown to
  // the user — slot pickers, day labels, booking confirmations — go through
  // userLocale.tz. Adrian's own notification still uses ADRIAN_TZ.
  const userLocale = resolveUserLocale(ctxNow?.country, cleanPhone);

  // Inject data-status context on every message so LLM knows what's missing
  const dataStatusLines = [
    `Nombre: ${knownName || "no disponible"}`,
    `Email: ${isRealEmail ? knownEmail : "NO DISPONIBLE — pedíselo antes de agendar"}`,
    `Teléfono: +${cleanPhone}`,
    `Ocupación: ${ctxNow?.occupation || "no especificada"}`,
  ];
  const missingForBooking: string[] = [];
  if (!isRealEmail) missingForBooking.push("email válido");
  if (!knownName) missingForBooking.push("nombre completo");
  const dataStatus = `[CONTEXTO INTERNO — Datos del prospecto:\n${dataStatusLines.join("\n")}\n${missingForBooking.length ? `⚠️ Falta para agendar: ${missingForBooking.join(", ")}.` : "✅ Tenés todos los datos para agendar."}]`;

  let contextPrefix = "";
  if (chatHistory.length === 0 && ctx) {
    // First message — fuller context for rapport
    contextPrefix = `[CONTEXTO INTERNO - NO mostrar al usuario: La persona se llama "${knownName || "desconocido"}", su ocupación es "${ctxNow?.occupation || "no especificada"}", descargó el recurso "${ctxNow?.resourceTitle || "recurso"}". Su email es ${knownEmail || "no disponible"}. Este es su PRIMER mensaje respondiendo a tu mensaje automatizado inicial.]\n\n${dataStatus}\n\n`;
  } else {
    contextPrefix = `${dataStatus}\n\n`;
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

  // Temporal context — the LLM needs today's date to convert "el lunes" / "mañana"
  // into a concrete YYYY-MM-DD for CHECK_DAY actions.
  const todayContextSection = buildTodayContextSection(userLocale);
  const systemPromptFull = SYSTEM_PROMPT + audioPromptSection + todayContextSection;

  // 6. Call OpenAI
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPromptFull },
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

      // Auto-move lead to "nutrido_bot" funnel stage
      if (conversation.leadId) {
        await db
          .update(leads)
          .set({ funnelStage: "nutrido_bot" })
          .where(eq(leads.id, conversation.leadId));
      }

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

  // Handle CHECK_DAY action — fetch 3 spread slots for the requested day
  // (or next available day) and re-prompt the LLM to present them naturally.
  // We also accept the legacy CHECK_AVAILABILITY as a shortcut for "tomorrow".
  const checkDayAction = agentResponse.actions?.find((a) => a.startsWith("CHECK_DAY:"));
  const legacyCheckAvailability = agentResponse.actions?.includes("CHECK_AVAILABILITY");
  if (checkDayAction || legacyCheckAvailability) {
    const requestedDate = checkDayAction
      ? checkDayAction.replace("CHECK_DAY:", "").trim()
      : tomorrowDateForTZ(userLocale.tz);

    console.log(`[WA Agent] CHECK_DAY triggered for ${cleanPhone} | requested: ${requestedDate} | tz: ${userLocale.tz}`);

    const result = await getThreeSlotsForDate(requestedDate, userLocale.tz);

    if (result.error || result.slots.length === 0) {
      console.error("[WA Agent] Cal.com no slots / error:", result.error);
      finalMessage +=
        "\n\n(Estoy con problemas para ver mi agenda en este momento, te paso el link directo para que elijas vos: https://cal.com/adrianortiz/llamada)";
    } else {
      const slotsBlock = result.slots
        .map((s) => `- ${s.shortLabel}  (UTC ISO: ${s.time})`)
        .join("\n");

      const dayHumanFmt = new Intl.DateTimeFormat("es", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: userLocale.tz,
      });
      const dayHuman = dayHumanFmt.format(new Date(`${result.date}T12:00:00Z`));

      const walkedNote =
        result.walkedForwardDays > 0
          ? `\nNOTA: el día solicitado (${result.requestedDate}) no tenía disponibilidad. Estás ofreciendo el primer día con espacio: ${result.date}. Avisalo brevemente y con naturalidad.`
          : "";

      const availabilityContext = `[CONTEXTO INTERNO — Horarios reales disponibles para ${dayHuman} (${result.date}), ya convertidos a la hora local del usuario en ${userLocale.countryName}:
${slotsBlock}

Reglas estrictas:
1. Mostrale al usuario las 3 opciones tal cual (ya están en SU hora local). NO inventes horarios distintos a estos. NO digas "hora argentina" salvo que el usuario también esté en Argentina.
2. Cuando el usuario elija UNO, en tu próxima respuesta incluí "BOOK_SLOT:" con el "UTC ISO" EXACTO de ese slot (no la hora local).
3. Si el usuario dice que ningún horario de este día le sirve, en tu próxima respuesta incluí "CHECK_DAY:YYYY-MM-DD" del día siguiente.
4. En este turno NO incluyas BOOK_SLOT — solo presentás opciones.${walkedNote}]`;

      const rebuildMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPromptFull },
        ...chatHistory,
        { role: "user", content: contextPrefix + messageText },
        { role: "assistant", content: JSON.stringify(agentResponse) },
        { role: "user", content: availabilityContext },
      ];

      const rebuildCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: rebuildMessages,
        temperature: 0.85,
        response_format: { type: "json_object" },
      });

      const rebuildText = rebuildCompletion.choices[0]?.message?.content || "";
      try {
        const rebuildResponse: AgentResponse = JSON.parse(rebuildText);
        finalMessage = rebuildResponse.message;
        agentResponse.stage = rebuildResponse.stage || "booking";
        agentResponse.actions = [
          ...(agentResponse.actions || []),
          ...(rebuildResponse.actions || []),
        ];
        // Strip CHECK_DAY / CHECK_AVAILABILITY from actions to avoid loops in this turn
        agentResponse.actions = agentResponse.actions.filter(
          (a) => a !== "CHECK_AVAILABILITY" && !a.startsWith("CHECK_DAY:")
        );
      } catch {
        console.error("[WA Agent] Failed to parse CHECK_DAY rebuild:", rebuildText);
      }
    }
  }

  // Persist any captured name/email from qualification_data into leadContext
  // so future messages have it and so BOOK_SLOT can use it.
  const qd = (agentResponse.qualification_data || {}) as Record<string, unknown>;
  const capturedEmail = typeof qd.email === "string" && qd.email.match(emailRegex)?.[0] ? qd.email : "";
  const capturedName = typeof qd.nombre_completo === "string" && qd.nombre_completo.trim().length > 1 ? qd.nombre_completo.trim() : (typeof qd.name === "string" ? qd.name.trim() : "");
  if (capturedEmail || capturedName) {
    const merged = {
      ...(conversation.leadContext as Record<string, string> || {}),
      ...(capturedEmail ? { email: capturedEmail } : {}),
      ...(capturedName ? { name: capturedName } : {}),
    };
    await db.update(waConversations)
      .set({ leadContext: merged, updatedAt: new Date() })
      .where(eq(waConversations.id, conversation.id));
    conversation = { ...conversation, leadContext: merged };
  }

  // Handle BOOK_SLOT action — guard on contact data, validate slot, then book.
  const bookSlotAction = agentResponse.actions?.find((a) => a.startsWith("BOOK_SLOT:"));
  if (bookSlotAction) {
    const slotTime = bookSlotAction.replace("BOOK_SLOT:", "").trim();
    console.log(`[WA Agent] BOOK_SLOT triggered: ${slotTime} for ${cleanPhone}`);

    // Get attendee info from (possibly just-merged) lead context
    const bookCtx = conversation.leadContext as Record<string, string> | null;
    const attendeeName = bookCtx?.name || senderName || "";
    const attendeeEmail = bookCtx?.email || "";
    const attendeePhone = `+${cleanPhone}`;
    const hasRealEmail = attendeeEmail && emailRegex.test(attendeeEmail) && !attendeeEmail.endsWith("@whatsapp.lead");

    if (!hasRealEmail || !attendeeName) {
      // Abort booking — ask for missing data instead of creating with fake email
      console.warn(`[WA Agent] BOOK_SLOT aborted, missing data. email=${attendeeEmail || "(none)"} name=${attendeeName || "(none)"}`);
      const need: string[] = [];
      if (!hasRealEmail) need.push("tu mail");
      if (!attendeeName) need.push("tu nombre completo");
      finalMessage = `Bárbaro, fijate que me pasés ${need.join(" y ")} así te mando la invitación de la reunión 🙌`;
      agentResponse.stage = "booking";
      // Fall through to send the message
    } else {
      // Validate the slot is actually available BEFORE calling Cal.com.
      // Catches both LLM-hallucinated timestamps and real races where the
      // slot got taken between display and booking.
      // Accept ISO with optional milliseconds and either Z or ±HH:MM offset.
      const slotIsValid = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/.test(slotTime)
        ? await isSlotAvailable(slotTime)
        : false;

      let bookingResult: Awaited<ReturnType<typeof createBooking>> | null = null;
      if (slotIsValid) {
        bookingResult = await createBooking(slotTime, {
          name: attendeeName,
          email: attendeeEmail,
          phoneNumber: attendeePhone,
          timeZone: userLocale.tz, // Cal will send the invite email in this tz
        });
      } else {
        console.error(`[WA Agent] BOOK_SLOT rejected: ${slotTime} not in Cal availability`);
      }

      if (bookingResult?.success) {
      console.log(`[WA Agent] Booking created: ${bookingResult.uid}`);

      // Format the confirmed time in the user's local timezone (for the user)
      // and in Adrian's timezone (for Adrian's notification).
      const confirmedDate = new Date(slotTime);
      const userDateFormatter = new Intl.DateTimeFormat("es", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: userLocale.tz,
        hour12: false,
      });
      const formattedTimeUser = userDateFormatter.format(confirmedDate);

      const adrianDateFormatter = new Intl.DateTimeFormat("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: ADRIAN_TZ,
        hour12: false,
      });
      const formattedTimeAdrian = adrianDateFormatter.format(confirmedDate);

      // Re-invoke LLM to confirm the booking naturally — in user's local time
      const bookingContext = `[CONTEXTO INTERNO — La reunión fue agendada exitosamente en Cal.com:\n📅 Fecha: ${formattedTimeUser} hs (hora local en ${userLocale.countryName})\n✅ Confirmación enviada al email: ${attendeeEmail}\n${bookingResult.meetUrl ? `📹 Link de la reunión: ${bookingResult.meetUrl}` : ""}\n\nConfirmale al prospecto que la reunión está agendada. Mencioná la fecha y hora EN SU HORA LOCAL. Si hay link de videollamada, compartilo. Stage: "booked".]`;

      const confirmMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPromptFull },
        ...chatHistory,
        { role: "user", content: contextPrefix + messageText },
        { role: "assistant", content: JSON.stringify(agentResponse) },
        { role: "user", content: bookingContext },
      ];

      const confirmCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: confirmMessages,
        temperature: 0.85,
        response_format: { type: "json_object" },
      });

      const confirmText = confirmCompletion.choices[0]?.message?.content || "";
      try {
        const confirmResponse: AgentResponse = JSON.parse(confirmText);
        finalMessage = confirmResponse.message;
        agentResponse.stage = "booked";
      } catch {
        // Fallback: manual confirmation message (in user's local time)
        finalMessage = `Listo, ya te agendé la reunión para el ${formattedTimeUser} hs 🙌${bookingResult.meetUrl ? `\n\n📹 Nos vemos acá: ${bookingResult.meetUrl}` : ""}`;
        agentResponse.stage = "booked";
      }

      // Update lead funnel stage
      if (conversation.leadId) {
        await db
          .update(leads)
          .set({ funnelStage: "reunion_agendada" })
          .where(eq(leads.id, conversation.leadId));
      }

      // Notify Adrian about the booking — Adrian sees ART; if the prospect
      // is in a different country, also show the prospect's local time.
      const userTimeNote =
        userLocale.tz === ADRIAN_TZ
          ? ""
          : `\n🌎 ${userLocale.countryName}: ${formattedTimeUser} hs`;
      await sendWhatsAppMessage(ADRIAN_PHONE,
        `📅 *REUNIÓN AGENDADA*\n\n👤 ${attendeeName}\n📱 +${cleanPhone}\n📧 ${attendeeEmail}\n🕐 ${formattedTimeAdrian} hs (Argentina)${userTimeNote}\n${bookingResult.meetUrl ? `📹 ${bookingResult.meetUrl}` : ""}`
      );

      // Booking complete → disconnect the agent from this conversation.
      // Sets active=false so the early-return guard at the top of
      // processIncomingMessage drops any future messages from this number,
      // and cancels any pending no-reply follow-ups.
      await db
        .update(waConversations)
        .set({ active: false, stage: "booked", updatedAt: new Date() })
        .where(eq(waConversations.id, conversation.id));
      cancelNoReplyFollowups(cleanPhone);
      console.log(`[WA Agent] ${cleanPhone} marked inactive after successful booking — agent disconnected.`);
    } else {
      const failureReason = bookingResult?.error || "slot no disponible / formato inválido";
      console.error("[WA Agent] Booking failed:", failureReason, "| slot:", slotTime);

      // The agent's pre-booking message likely already said "te agendo..." —
      // we discard it and re-prompt the LLM with fresh availability for the
      // same day, so the user gets ONE coherent message offering real slots.
      const failureDate = slotTime.split("T")[0] || tomorrowDateForTZ(userLocale.tz);
      const fallback = await getThreeSlotsForDate(failureDate, userLocale.tz);

      if (!fallback.error && fallback.slots.length > 0) {
        const slotsBlock = fallback.slots
          .map((s) => `- ${s.shortLabel}  (UTC ISO: ${s.time})`)
          .join("\n");
        const dayHumanFmt = new Intl.DateTimeFormat("es", {
          weekday: "long",
          day: "numeric",
          month: "long",
          timeZone: userLocale.tz,
        });
        const dayHuman = dayHumanFmt.format(new Date(`${fallback.date}T12:00:00Z`));

        const failureContext = `[CONTEXTO INTERNO — El horario que el usuario eligió YA NO está disponible en mi agenda (otra reunión lo ocupó o el horario no era válido). NO confirmes la reunión. NO digas "te agendo" ni "ya te agendé". Pedí disculpas brevemente y ofrecé estos 3 horarios reales para ${dayHuman} (${fallback.date}):
${slotsBlock}

Reglas:
1. Mostrale las opciones en hora local (Argentina) y preguntale cuál prefiere.
2. NO incluyas BOOK_SLOT en este turno — solo ofrecés las nuevas opciones.
3. Cuando elija una, en el siguiente turno usá BOOK_SLOT con el UTC ISO exacto.
4. Stage: "booking" (NO "booked").]`;

        const retryMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          { role: "system", content: systemPromptFull },
          ...chatHistory,
          { role: "user", content: contextPrefix + messageText },
          { role: "assistant", content: JSON.stringify(agentResponse) },
          { role: "user", content: failureContext },
        ];

        const retryCompletion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: retryMessages,
          temperature: 0.85,
          response_format: { type: "json_object" },
        });

        const retryText = retryCompletion.choices[0]?.message?.content || "";
        try {
          const retryResponse: AgentResponse = JSON.parse(retryText);
          finalMessage = retryResponse.message;
          agentResponse.stage = "booking";
        } catch {
          finalMessage = `Uy, ese horario se me ocupó recién. Para ${dayHuman} tengo ${fallback.slots
            .map((s) => s.shortLabel)
            .join(", ")}. ¿Cuál te queda mejor?`;
          agentResponse.stage = "booking";
        }
      } else {
        // Hard fallback: no availability at all — give them the link.
        finalMessage =
          "Uy, se me complicó la agenda en este momento. Te paso el link directo para que elijas el horario que mejor te quede: https://cal.com/adrianortiz/llamada";
        agentResponse.stage = "booking";
      }
    }
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

  // Handle OPT_OUT action — user doesn't want to be contacted
  if (agentResponse.actions?.includes("OPT_OUT")) {
    console.log(`[WA Agent] User ${cleanPhone} opted out — deactivating agent for this conversation`);
    await db
      .update(waConversations)
      .set({ optedOut: true, active: false, stage: "inactive", updatedAt: new Date() })
      .where(eq(waConversations.id, conversation.id));

    // Cancel any scheduled followups
    cancelNoReplyFollowups(cleanPhone);
  }

  // 9. Auto-send pre-recorded audio based on action/stage.
  //
  // Audios may only be sent when the prospect has shown explicit interest
  // in the asesorías. In practice that means: stage has progressed past
  // qualification AND we are sending the link (or the LLM explicitly asked
  // for an audio). NEVER on first contact / greeting / discovery /
  // qualification — at those stages we don't know the prospect yet.
  let autoAudioTrigger: string | null = null;

  const QUALIFIED_STAGES = new Set([
    "value_delivery", "link_offer", "followup", "closing", "booking", "booked",
  ]);
  const isQualified = QUALIFIED_STAGES.has(agentResponse.stage);

  // Auto-trigger when the link is being sent (this is the key moment of
  // explicit interest — the LLM only emits SEND_LINK after qualification).
  if (
    agentResponse.actions?.includes("SEND_LINK") ||
    agentResponse.message.includes("[ENVIAR_LINK]")
  ) {
    autoAudioTrigger = "link_offer";
  }

  // LLM-requested audio overrides auto-trigger key, but still requires
  // the conversation to have reached a qualified stage.
  const audioAction = agentResponse.actions?.find((a) => a.startsWith("SEND_AUDIO:"));
  if (audioAction) {
    if (isQualified) {
      autoAudioTrigger = audioAction.replace("SEND_AUDIO:", "");
    } else {
      console.log(
        `[WA Agent] LLM requested SEND_AUDIO at stage "${agentResponse.stage}" — blocked, prospect not qualified yet.`
      );
    }
  }

  // Final stage guard — block any audio attempt during early stages even
  // if a trigger somehow slipped through.
  if (autoAudioTrigger && !isQualified) {
    console.log(
      `[WA Agent] Audio "${autoAudioTrigger}" suppressed: stage "${agentResponse.stage}" is pre-qualification.`
    );
    autoAudioTrigger = null;
  }

  // Send the audio if we have a trigger
  let audioWasSent = false;
  if (autoAudioTrigger) {
    // Check if this audio was already sent in this conversation
    const alreadySent = chatHistory.some(
      (m) => m.role === "assistant" && String(m.content || "").includes("[Audio enviado:") && String(m.content || "").includes(autoAudioTrigger!)
    );

    if (alreadySent) {
      console.log(`[WA Agent] Audio "${autoAudioTrigger}" already sent in this conversation — skipping`);
    } else {
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

  // 13. Schedule no-reply follow-ups — except when booking is complete
  if (agentResponse.stage !== "booked") {
    scheduleNoReplyFollowups(cleanPhone, conversation.id, leadCtx?.country || null);
  }

  console.log(
    `[WA Agent] Processed message for ${cleanPhone} | Stage: ${agentResponse.stage} | Score: ${agentResponse.qualification_score}`
  );
}

// ─── Find existing conversation ──────────────────────────────────────────────
async function findConversation(phone: string) {
  const [conv] = await db
    .select()
    .from(waConversations)
    .where(eq(waConversations.phone, phone))
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
  // Generate a short 8-character alphanumeric code instead of a full UUID
  const token = crypto.randomBytes(4).toString("hex"); // 8 chars like "a3f1b2c4"

  await db.insert(waLinkTokens).values({
    conversationId,
    token,
    targetUrl: "https://adrian-ortiz.com/asesorias",
  });

  return `${APP_URL}/go/${token}`;
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
    ? `${firstName}! Vi que le echaste un vistazo a las asesorías 👀 ¿Qué te pareció? ¿Tenés alguna duda o consulta? Estoy para ayudarte en lo que necesites, de verdad.`
    : `Buenas! Vi que le echaste un vistazo a las asesorías 👀 ¿Qué te pareció? ¿Tenés alguna duda? Estoy para ayudarte.`;

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

// ─── Locale / timezone helpers ───────────────────────────────────────────────

const AR_TZ = "America/Argentina/Buenos_Aires";
const ADRIAN_TZ = AR_TZ; // used for Adrian's own notification

// Phone dial-prefix → ISO 3166-1 alpha-2 country code. Ordered longest-first
// so a 4-digit prefix wins over an embedded 1-digit prefix.
const PHONE_PREFIX_TO_COUNTRY: Array<[string, string]> = [
  ["1809", "DO"], ["1829", "DO"], ["1849", "DO"],
  ["1787", "PR"], ["1939", "PR"],
  ["598", "UY"], ["595", "PY"], ["593", "EC"], ["591", "BO"],
  ["507", "PA"], ["506", "CR"], ["505", "NI"], ["504", "HN"],
  ["503", "SV"], ["502", "GT"],
  ["58", "VE"], ["57", "CO"], ["56", "CL"], ["55", "BR"],
  ["54", "AR"], ["53", "CU"], ["52", "MX"], ["51", "PE"],
  ["44", "GB"], ["34", "ES"],
  ["1", "US"], // catch-all for NANP — could also be CA, but US is the safer default for the audience
];

const COUNTRY_TO_TZ: Record<string, string> = {
  AR: "America/Argentina/Buenos_Aires",
  UY: "America/Montevideo",
  BR: "America/Sao_Paulo",
  CL: "America/Santiago",
  CO: "America/Bogota",
  PE: "America/Lima",
  MX: "America/Mexico_City",
  EC: "America/Guayaquil",
  VE: "America/Caracas",
  PY: "America/Asuncion",
  BO: "America/La_Paz",
  CR: "America/Costa_Rica",
  PA: "America/Panama",
  DO: "America/Santo_Domingo",
  GT: "America/Guatemala",
  HN: "America/Tegucigalpa",
  SV: "America/El_Salvador",
  NI: "America/Managua",
  CU: "America/Havana",
  PR: "America/Puerto_Rico",
  US: "America/New_York", // default to Eastern; user's actual zone may differ
  ES: "Europe/Madrid",
  GB: "Europe/London",
};

const COUNTRY_NAMES_ES: Record<string, string> = {
  AR: "Argentina", UY: "Uruguay", BR: "Brasil", CL: "Chile",
  CO: "Colombia", PE: "Perú", MX: "México", EC: "Ecuador",
  VE: "Venezuela", PY: "Paraguay", BO: "Bolivia", CR: "Costa Rica",
  PA: "Panamá", DO: "República Dominicana", GT: "Guatemala",
  HN: "Honduras", SV: "El Salvador", NI: "Nicaragua",
  CU: "Cuba", PR: "Puerto Rico", US: "Estados Unidos",
  ES: "España", GB: "Reino Unido",
};

interface UserLocale {
  tz: string;            // IANA timezone — used for slot fetch and display
  country: string | null; // ISO 3166-1 alpha-2 — null if undetected
  countryName: string;   // Spanish name for the country (or "su zona" fallback)
}

function detectCountryFromPhone(phone: string): string | null {
  const clean = phone.replace(/[^0-9]/g, "");
  for (const [prefix, country] of PHONE_PREFIX_TO_COUNTRY) {
    if (clean.startsWith(prefix)) return country;
  }
  return null;
}

/**
 * Resolves the user's timezone + country, preferring the country stored in
 * leadContext (set at lead capture from the form). Falls back to the phone
 * prefix, and finally to ART so the bot still works for unknown numbers.
 */
function resolveUserLocale(
  leadCountry: string | null | undefined,
  phone: string
): UserLocale {
  let country = leadCountry?.toUpperCase().trim() || null;
  if (!country || !COUNTRY_TO_TZ[country]) {
    country = detectCountryFromPhone(phone);
  }
  const tz = (country && COUNTRY_TO_TZ[country]) || AR_TZ;
  const countryName = country
    ? (COUNTRY_NAMES_ES[country] || country)
    : "tu zona";
  return { tz, country, countryName };
}

/** Returns today's date in the given tz as "YYYY-MM-DD". */
function todayDateForTZ(tz: string): string {
  // en-CA emits ISO-style YYYY-MM-DD when given the right options
  const fmt = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: tz,
  });
  return fmt.format(new Date());
}

/** Returns tomorrow's date in the given tz as "YYYY-MM-DD". */
function tomorrowDateForTZ(tz: string): string {
  const today = todayDateForTZ(tz);
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().split("T")[0];
}

/**
 * Builds the system-prompt section telling the LLM today's date in the
 * user's local timezone. The LLM uses this to resolve "el lunes" / "mañana"
 * into a concrete YYYY-MM-DD for CHECK_DAY, and to know which timezone its
 * spoken time references should be in.
 */
function buildTodayContextSection(locale: UserLocale): string {
  const today = todayDateForTZ(locale.tz);
  const humanFmt = new Intl.DateTimeFormat("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: locale.tz,
  });
  const humanToday = humanFmt.format(new Date(`${today}T12:00:00Z`));
  return `\n\n# CONTEXTO TEMPORAL
La persona está en ${locale.countryName} (zona horaria ${locale.tz}).
Hoy es ${humanToday} (${today}, hora local de la persona).

Reglas:
- Cuando el usuario diga un día relativo ("hoy", "mañana", "el lunes", "el viernes próximo"), convertilo a YYYY-MM-DD usando esta fecha como referencia, y mandalo en "CHECK_DAY:YYYY-MM-DD".
- Todos los horarios que el sistema te pase ya están convertidos a la hora local del usuario; mostralos tal cual y NO menciones "hora argentina" salvo que el usuario también esté en Argentina.`;
}
