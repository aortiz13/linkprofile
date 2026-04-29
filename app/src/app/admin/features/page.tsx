"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  BarChart3,
  Palette,
  Brain,
  Check,
  Loader2,
  Save,
  ChevronDown,
  Info,
  Zap,
} from "lucide-react";

type GreetingTexts = {
  morning: string;
  afternoon: string;
  evening: string;
  night: string;
  returning: string;
  weatherClear: string;
  weatherClouds: string;
  weatherRain: string;
  weatherSnow: string;
  weatherStorm: string;
  weatherMist: string;
};

type PredictionTexts = {
  fastScrollTitle: string;
  fastScrollSubtitle: string;
  exitIntentTitle: string;
  exitIntentSubtitle: string;
  inactivityTitle: string;
  inactivitySubtitle: string;
};

type FeatureConfig = {
  aiGreeting: {
    enabled: boolean;
    showCity: boolean;
    showReferrer: boolean;
    showWeather: boolean;
    showReturning: boolean;
    texts: GreetingTexts;
  };
  leadScoring: {
    enabled: boolean;
    hotLeadThreshold: number;
    trackScroll: boolean;
    trackTime: boolean;
    trackProductHover: boolean;
    trackFormFocus: boolean;
    webhookUrl: string;
  };
  moodTheme: {
    enabled: boolean;
    applyToLightTheme: boolean;
  };
  predictionEngine: {
    enabled: boolean;
    fastScrollCTA: boolean;
    exitIntentCTA: boolean;
    inactivityCTA: boolean;
    inactivityTimeout: number;
    maxCTAsPerSession: number;
    texts: PredictionTexts;
  };
};

const DEFAULT_CONFIG: FeatureConfig = {
  aiGreeting: {
    enabled: true, showCity: true, showReferrer: true, showWeather: true, showReturning: true,
    texts: {
      morning: "Buenos días", afternoon: "Buenas tardes", evening: "Buenas noches", night: "Buenas noches",
      returning: "¡Qué bueno verte de nuevo! 👋",
      weatherClear: "Hermoso día soleado por allá ☀️", weatherClouds: "Un día nublado, perfecto para explorar 🌥️",
      weatherRain: "Llueve por allá, ideal para quedarse navegando 🌧️", weatherSnow: "¡Está nevando por tu ciudad! ❄️",
      weatherStorm: "Tormenta eléctrica... mejor quedarse adentro ⛈️", weatherMist: "Día con neblina, misterioso 🌫️",
    },
  },
  leadScoring: { enabled: true, hotLeadThreshold: 70, trackScroll: true, trackTime: true, trackProductHover: true, trackFormFocus: true, webhookUrl: "" },
  moodTheme: { enabled: true, applyToLightTheme: false },
  predictionEngine: {
    enabled: true, fastScrollCTA: true, exitIntentCTA: true, inactivityCTA: true, inactivityTimeout: 30, maxCTAsPerSession: 1,
    texts: {
      fastScrollTitle: "⚡ ¿Buscas algo específico?", fastScrollSubtitle: "Parece que estás buscando algo en particular. ¿Te puedo ayudar?",
      exitIntentTitle: "👋 ¡Espera! No te vayas aún", exitIntentSubtitle: "Tenemos algo especial para ti. ¿Le das una oportunidad?",
      inactivityTitle: "👀 ¿Sigues ahí?", inactivitySubtitle: "No te pierdas lo que tenemos para ofrecerte",
    },
  },
};

// ─── Toggle Switch Component ─────────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)] ${
        checked ? "bg-[var(--accent)]" : "bg-[var(--border)]"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ─── Feature Card ────────────────────────────────────────────────────────────
function FeatureCard({
  icon: Icon,
  iconColor,
  title,
  description,
  enabled,
  onToggle,
  badge,
  children,
  defaultOpen = false,
}: {
  icon: typeof Sparkles;
  iconColor: string;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-[var(--border)] rounded-[var(--radius-xl)] bg-[var(--bg-surface)] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-4 p-5">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconColor + "15" }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
            {badge && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ backgroundColor: iconColor + "20", color: iconColor }}>
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">{description}</p>
        </div>

        <Toggle checked={enabled} onChange={onToggle} />

        <button
          onClick={() => setOpen(!open)}
          className={`p-1.5 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all ${
            open ? "rotate-180" : ""
          }`}
        >
          <ChevronDown className="w-4 h-4 transition-transform" />
        </button>
      </div>

      {/* Expandable Settings */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0 border-t border-[var(--border)]">
              <div className="pt-4 space-y-3">
                {children}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Setting Row ─────────────────────────────────────────────────────────────
function SettingRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-[var(--radius-md)] hover:bg-[var(--bg-elevated)] transition-colors">
      <div>
        <p className="text-sm text-[var(--text-primary)]">{label}</p>
        {description && <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

// ─── Number Input Row ────────────────────────────────────────────────────────
function NumberRow({
  label,
  description,
  value,
  onChange,
  min,
  max,
  suffix,
  disabled,
}: {
  label: string;
  description?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-[var(--radius-md)] hover:bg-[var(--bg-elevated)] transition-colors">
      <div>
        <p className="text-sm text-[var(--text-primary)]">{label}</p>
        {description && <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          disabled={disabled}
          className="w-20 px-2 py-1.5 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm text-right focus:outline-none focus:border-[var(--accent)]"
        />
        {suffix && <span className="text-xs text-[var(--text-muted)]">{suffix}</span>}
      </div>
    </div>
  );
}

// ─── Text Input Row ──────────────────────────────────────────────────────────
function TextRow({
  label,
  description,
  value,
  onChange,
  placeholder,
  disabled,
  type = "url",
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <div className="py-2.5 px-3 rounded-[var(--radius-md)]">
      <p className="text-sm text-[var(--text-primary)] mb-1">{label}</p>
      {description && <p className="text-xs text-[var(--text-muted)] mb-2">{description}</p>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-muted)]"
      />
    </div>
  );
}

// ─── Texts Section ───────────────────────────────────────────────────────────
function TextsSection({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2 border border-[var(--border)] rounded-[var(--radius-md)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
      >
        <span>✏️ {label}</span>
        <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-[var(--border)] pt-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function FeaturesPage() {
  const [config, setConfig] = useState<FeatureConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Load config
  useEffect(() => {
    fetch("/api/admin/features")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setConfig((prev) => ({
            aiGreeting: { ...prev.aiGreeting, ...data.aiGreeting },
            leadScoring: { ...prev.leadScoring, ...data.leadScoring },
            moodTheme: { ...prev.moodTheme, ...data.moodTheme },
            predictionEngine: { ...prev.predictionEngine, ...data.predictionEngine },
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = useCallback((section: keyof FeatureConfig, key: string, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
    setDirty(true);
    setSaved(false);
  }, []);

  const updateText = useCallback((section: "aiGreeting" | "predictionEngine", textKey: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        texts: { ...prev[section].texts, [textKey]: value },
      },
    }));
    setDirty(true);
    setSaved(false);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/admin/features", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      setSaved(true);
      setDirty(false);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // Error handled silently
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">AI Features</h1>
              <p className="text-sm text-[var(--text-muted)]">Personalización inteligente y predicción conductual</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-lg)] text-sm font-medium transition-all duration-200 ${
            dirty
              ? "bg-[var(--accent)] text-white hover:brightness-110 shadow-lg shadow-[var(--accent)]/20"
              : saved
              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
              : "bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)]"
          } ${(!dirty && !saved) ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Guardando..." : saved ? "Guardado" : "Guardar"}
        </button>
      </div>

      {/* Info Banner */}
      <div className="mb-6 p-4 rounded-[var(--radius-lg)] bg-[var(--accent)]/5 border border-[var(--accent)]/15 flex items-start gap-3">
        <Info className="w-4 h-4 text-[var(--accent)] mt-0.5 shrink-0" />
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Estas funciones se activan automáticamente en tu página pública. Cada visitante recibe una experiencia única basada en su ubicación, comportamiento y contexto. Los cambios se aplican inmediatamente después de guardar.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="space-y-4">
        {/* AI Greeting */}
        <FeatureCard
          icon={Sparkles}
          iconColor="#8b5cf6"
          title="Saludo AI Personalizado"
          description="Genera un saludo único con ciudad, clima, referrer y más"
          badge="AI"
          enabled={config.aiGreeting.enabled}
          onToggle={(v) => update("aiGreeting", "enabled", v)}
          defaultOpen
        >
          <SettingRow
            label="🏙️ Mostrar ciudad"
            description="Incluye la ciudad detectada del visitante"
            checked={config.aiGreeting.showCity}
            onChange={(v) => update("aiGreeting", "showCity", v)}
            disabled={!config.aiGreeting.enabled}
          />
          <SettingRow
            label="📱 Fuente de tráfico"
            description="Muestra de dónde viene (Instagram, Google, etc.)"
            checked={config.aiGreeting.showReferrer}
            onChange={(v) => update("aiGreeting", "showReferrer", v)}
            disabled={!config.aiGreeting.enabled}
          />
          <SettingRow
            label="🌤️ Clima del visitante"
            description="Comenta el clima real de la ciudad detectada"
            checked={config.aiGreeting.showWeather}
            onChange={(v) => update("aiGreeting", "showWeather", v)}
            disabled={!config.aiGreeting.enabled}
          />
          <SettingRow
            label="👋 Visitante recurrente"
            description="Mensaje especial si la persona ya visitó antes"
            checked={config.aiGreeting.showReturning}
            onChange={(v) => update("aiGreeting", "showReturning", v)}
            disabled={!config.aiGreeting.enabled}
          />

          <TextsSection label="Personalizar textos del saludo">
            <TextRow label="🌅 Saludo mañana" value={config.aiGreeting.texts.morning} onChange={(v) => updateText("aiGreeting", "morning", v)} type="text" disabled={!config.aiGreeting.enabled} />
            <TextRow label="☀️ Saludo tarde" value={config.aiGreeting.texts.afternoon} onChange={(v) => updateText("aiGreeting", "afternoon", v)} type="text" disabled={!config.aiGreeting.enabled} />
            <TextRow label="🌆 Saludo noche" value={config.aiGreeting.texts.evening} onChange={(v) => updateText("aiGreeting", "evening", v)} type="text" disabled={!config.aiGreeting.enabled} />
            <TextRow label="👋 Visitante recurrente" value={config.aiGreeting.texts.returning} onChange={(v) => updateText("aiGreeting", "returning", v)} type="text" disabled={!config.aiGreeting.enabled} />
            <TextRow label="☀️ Clima soleado" value={config.aiGreeting.texts.weatherClear} onChange={(v) => updateText("aiGreeting", "weatherClear", v)} type="text" disabled={!config.aiGreeting.enabled} />
            <TextRow label="🌥️ Clima nublado" value={config.aiGreeting.texts.weatherClouds} onChange={(v) => updateText("aiGreeting", "weatherClouds", v)} type="text" disabled={!config.aiGreeting.enabled} />
            <TextRow label="🌧️ Clima lluvioso" value={config.aiGreeting.texts.weatherRain} onChange={(v) => updateText("aiGreeting", "weatherRain", v)} type="text" disabled={!config.aiGreeting.enabled} />
            <TextRow label="❄️ Clima nevando" value={config.aiGreeting.texts.weatherSnow} onChange={(v) => updateText("aiGreeting", "weatherSnow", v)} type="text" disabled={!config.aiGreeting.enabled} />
            <TextRow label="⛈️ Tormenta" value={config.aiGreeting.texts.weatherStorm} onChange={(v) => updateText("aiGreeting", "weatherStorm", v)} type="text" disabled={!config.aiGreeting.enabled} />
            <TextRow label="🌫️ Neblina" value={config.aiGreeting.texts.weatherMist} onChange={(v) => updateText("aiGreeting", "weatherMist", v)} type="text" disabled={!config.aiGreeting.enabled} />
          </TextsSection>
        </FeatureCard>

        {/* Lead Scoring */}
        <FeatureCard
          icon={BarChart3}
          iconColor="#f59e0b"
          title="Predictive Lead Scoring"
          description="Puntúa visitantes del 0 al 100 según su comportamiento"
          badge="PREDICTIVO"
          enabled={config.leadScoring.enabled}
          onToggle={(v) => update("leadScoring", "enabled", v)}
        >
          <SettingRow
            label="📜 Tracking de scroll"
            description="Detecta profundidad de scroll (25%, 50%, 75%, 100%)"
            checked={config.leadScoring.trackScroll}
            onChange={(v) => update("leadScoring", "trackScroll", v)}
            disabled={!config.leadScoring.enabled}
          />
          <SettingRow
            label="⏱️ Tiempo en página"
            description="Puntúa por permanencia (>60s, >120s)"
            checked={config.leadScoring.trackTime}
            onChange={(v) => update("leadScoring", "trackTime", v)}
            disabled={!config.leadScoring.enabled}
          />
          <SettingRow
            label="🛍️ Hover en productos"
            description="Detecta interés sostenido en productos (>2s)"
            checked={config.leadScoring.trackProductHover}
            onChange={(v) => update("leadScoring", "trackProductHover", v)}
            disabled={!config.leadScoring.enabled}
          />
          <SettingRow
            label="📝 Interacción con formulario"
            description="Puntúa cuando el visitante toca un campo del form"
            checked={config.leadScoring.trackFormFocus}
            onChange={(v) => update("leadScoring", "trackFormFocus", v)}
            disabled={!config.leadScoring.enabled}
          />
          <NumberRow
            label="🔥 Umbral de Hot Lead"
            description="Score mínimo para marcar como lead caliente"
            value={config.leadScoring.hotLeadThreshold}
            onChange={(v) => update("leadScoring", "hotLeadThreshold", v)}
            min={10}
            max={100}
            suffix="pts"
            disabled={!config.leadScoring.enabled}
          />
          <TextRow
            label="🔗 Webhook URL (opcional)"
            description="Envía notificación cuando se detecta un hot lead"
            value={config.leadScoring.webhookUrl}
            onChange={(v) => update("leadScoring", "webhookUrl", v)}
            placeholder="https://tu-webhook.com/hot-lead"
            disabled={!config.leadScoring.enabled}
          />
        </FeatureCard>

        {/* Mood Theme */}
        <FeatureCard
          icon={Palette}
          iconColor="#06b6d4"
          title="Mood-Adaptive Theme"
          description="Los colores cambian según la hora del día y el clima real"
          badge="AMBIENTAL"
          enabled={config.moodTheme.enabled}
          onToggle={(v) => update("moodTheme", "enabled", v)}
        >
          <SettingRow
            label="☀️ Aplicar en tema claro"
            description="Por defecto solo funciona en temas oscuros/glass"
            checked={config.moodTheme.applyToLightTheme}
            onChange={(v) => update("moodTheme", "applyToLightTheme", v)}
            disabled={!config.moodTheme.enabled}
          />

          <div className="mt-2 p-3 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border)]">
            <p className="text-xs text-[var(--text-muted)] mb-2 font-medium">Paletas por franja horaria:</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { time: "Mañana", color: "#f59e0b", emoji: "🌅" },
                { time: "Tarde", color: "#f97316", emoji: "☀️" },
                { time: "Atardecer", color: "#a855f7", emoji: "🌆" },
                { time: "Noche", color: "#6366f1", emoji: "🌙" },
              ].map((p) => (
                <div key={p.time} className="text-center">
                  <div className="text-lg mb-1">{p.emoji}</div>
                  <div className="w-full h-2 rounded-full" style={{ backgroundColor: p.color }} />
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">{p.time}</p>
                </div>
              ))}
            </div>
          </div>
        </FeatureCard>

        {/* Prediction Engine */}
        <FeatureCard
          icon={Brain}
          iconColor="#ec4899"
          title="Behavioral Prediction Engine"
          description="Anticipa la intención del visitante y muestra CTAs inteligentes"
          badge="PREDICTIVO"
          enabled={config.predictionEngine.enabled}
          onToggle={(v) => update("predictionEngine", "enabled", v)}
        >
          <SettingRow
            label="⚡ CTA de scroll rápido"
            description="Muestra mensaje si el visitante scrollea muy rápido"
            checked={config.predictionEngine.fastScrollCTA}
            onChange={(v) => update("predictionEngine", "fastScrollCTA", v)}
            disabled={!config.predictionEngine.enabled}
          />
          <SettingRow
            label="🚪 CTA de exit intent"
            description="Muestra mensaje cuando el mouse sale del viewport (desktop)"
            checked={config.predictionEngine.exitIntentCTA}
            onChange={(v) => update("predictionEngine", "exitIntentCTA", v)}
            disabled={!config.predictionEngine.enabled}
          />
          <SettingRow
            label="💤 CTA de inactividad"
            description="Muestra mensaje tras período de inactividad"
            checked={config.predictionEngine.inactivityCTA}
            onChange={(v) => update("predictionEngine", "inactivityCTA", v)}
            disabled={!config.predictionEngine.enabled}
          />
          <NumberRow
            label="⏲️ Timeout de inactividad"
            description="Segundos sin actividad antes de mostrar el CTA"
            value={config.predictionEngine.inactivityTimeout}
            onChange={(v) => update("predictionEngine", "inactivityTimeout", v)}
            min={10}
            max={120}
            suffix="seg"
            disabled={!config.predictionEngine.enabled}
          />
          <NumberRow
            label="🎯 Máx CTAs por sesión"
            description="Límite de mensajes mostrados por visita"
            value={config.predictionEngine.maxCTAsPerSession}
            onChange={(v) => update("predictionEngine", "maxCTAsPerSession", v)}
            min={1}
            max={5}
            disabled={!config.predictionEngine.enabled}
          />

          <TextsSection label="Personalizar textos de los CTAs">
            <TextRow label="⚡ Título — Scroll rápido" value={config.predictionEngine.texts.fastScrollTitle} onChange={(v) => updateText("predictionEngine", "fastScrollTitle", v)} type="text" disabled={!config.predictionEngine.enabled} />
            <TextRow label="⚡ Subtítulo — Scroll rápido" value={config.predictionEngine.texts.fastScrollSubtitle} onChange={(v) => updateText("predictionEngine", "fastScrollSubtitle", v)} type="text" disabled={!config.predictionEngine.enabled} />
            <TextRow label="🚪 Título — Exit intent" value={config.predictionEngine.texts.exitIntentTitle} onChange={(v) => updateText("predictionEngine", "exitIntentTitle", v)} type="text" disabled={!config.predictionEngine.enabled} />
            <TextRow label="🚪 Subtítulo — Exit intent" value={config.predictionEngine.texts.exitIntentSubtitle} onChange={(v) => updateText("predictionEngine", "exitIntentSubtitle", v)} type="text" disabled={!config.predictionEngine.enabled} />
            <TextRow label="💤 Título — Inactividad" value={config.predictionEngine.texts.inactivityTitle} onChange={(v) => updateText("predictionEngine", "inactivityTitle", v)} type="text" disabled={!config.predictionEngine.enabled} />
            <TextRow label="💤 Subtítulo — Inactividad" value={config.predictionEngine.texts.inactivitySubtitle} onChange={(v) => updateText("predictionEngine", "inactivitySubtitle", v)} type="text" disabled={!config.predictionEngine.enabled} />
          </TextsSection>
        </FeatureCard>
      </div>
    </div>
  );
}
