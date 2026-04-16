import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * GET /api/admin/features — Read AI features config
 * PATCH /api/admin/features — Update AI features config
 * 
 * Config is stored as a JSONB column on the profile.
 * Falls back to defaults if not set.
 */

const DEFAULT_CONFIG = {
  aiGreeting: {
    enabled: true,
    showCity: true,
    showReferrer: true,
    showWeather: true,
    showReturning: true,
    texts: {
      morning: "Buenos días",
      afternoon: "Buenas tardes",
      evening: "Buenas noches",
      night: "Buenas noches",
      returning: "¡Qué bueno verte de nuevo! 👋",
      weatherClear: "Hermoso día soleado por allá ☀️",
      weatherClouds: "Un día nublado, perfecto para explorar 🌥️",
      weatherRain: "Llueve por allá, ideal para quedarse navegando 🌧️",
      weatherSnow: "¡Está nevando por tu ciudad! ❄️",
      weatherStorm: "Tormenta eléctrica... mejor quedarse adentro ⛈️",
      weatherMist: "Día con neblina, misterioso 🌫️",
    },
  },
  leadScoring: {
    enabled: true,
    hotLeadThreshold: 70,
    trackScroll: true,
    trackTime: true,
    trackProductHover: true,
    trackFormFocus: true,
    webhookUrl: "",
  },
  moodTheme: {
    enabled: true,
    applyToLightTheme: false,
  },
  predictionEngine: {
    enabled: true,
    fastScrollCTA: true,
    exitIntentCTA: true,
    inactivityCTA: true,
    inactivityTimeout: 30,
    maxCTAsPerSession: 1,
    texts: {
      fastScrollTitle: "⚡ ¿Buscas algo específico?",
      fastScrollSubtitle: "Parece que estás buscando algo en particular. ¿Te puedo ayudar?",
      exitIntentTitle: "👋 ¡Espera! No te vayas aún",
      exitIntentSubtitle: "Tenemos algo especial para ti. ¿Le das una oportunidad?",
      inactivityTitle: "👀 ¿Sigues ahí?",
      inactivitySubtitle: "No te pierdas lo que tenemos para ofrecerte",
    },
  },
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.profileId),
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  // Read from metadata jsonb or return defaults
  const raw = (profile as Record<string, unknown>).aiFeatures as Record<string, unknown> | null;
  const config = raw ? { ...DEFAULT_CONFIG, ...raw } : DEFAULT_CONFIG;

  return NextResponse.json(config);
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Merge with defaults to ensure no missing keys
  const merged = {
    aiGreeting: { ...DEFAULT_CONFIG.aiGreeting, ...(body.aiGreeting || {}) },
    leadScoring: { ...DEFAULT_CONFIG.leadScoring, ...(body.leadScoring || {}) },
    moodTheme: { ...DEFAULT_CONFIG.moodTheme, ...(body.moodTheme || {}) },
    predictionEngine: { ...DEFAULT_CONFIG.predictionEngine, ...(body.predictionEngine || {}) },
  };

  // Store in the aiFeatures JSONB column
  await db.execute(
    sql`UPDATE profiles SET ai_features = ${JSON.stringify(merged)}::jsonb, updated_at = NOW() WHERE id = ${user.profileId}`
  );

  return NextResponse.json(merged);
}
