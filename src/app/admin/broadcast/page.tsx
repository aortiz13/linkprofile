"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Megaphone, Send, Pause, Play, X, RefreshCw, Eye, Users,
  CheckCircle2, XCircle, Clock, Loader2, Filter, Zap, Shield, AlertTriangle,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Campaign {
  id: string;
  name: string;
  template: string;
  filters: Record<string, unknown>;
  status: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  replyCount: number;
  rateConfig: Record<string, number>;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

type SpeedPreset = "conservative" | "moderate" | "aggressive";

const SPEED_PRESETS: Record<SpeedPreset, { label: string; desc: string; icon: typeof Shield; config: Record<string, number> }> = {
  conservative: {
    label: "Conservador",
    desc: "15-45s entre mensajes, pausa cada 8",
    icon: Shield,
    config: { intervalMinMs: 15000, intervalMaxMs: 45000, pauseEveryN: 8, pauseDurationMs: 180000, maxPerSession: 50 },
  },
  moderate: {
    label: "Moderado",
    desc: "8-20s entre mensajes, pausa cada 12",
    icon: Zap,
    config: { intervalMinMs: 8000, intervalMaxMs: 20000, pauseEveryN: 12, pauseDurationMs: 120000, maxPerSession: 80 },
  },
  aggressive: {
    label: "Agresivo",
    desc: "5-10s entre mensajes — mayor riesgo",
    icon: AlertTriangle,
    config: { intervalMinMs: 5000, intervalMaxMs: 10000, pauseEveryN: 15, pauseDurationMs: 90000, maxPerSession: 120 },
  },
};

const FUNNEL_STAGES = [
  { key: "lead", label: "Lead" },
  { key: "nutrido_bot", label: "Nutrido Bot" },
  { key: "asesor_humano", label: "Asesor Humano" },
  { key: "reunion_agendada", label: "Reunión Agendada" },
  { key: "seguimiento", label: "Seguimiento" },
];

// ─── Spintax preview (client-side) ───────────────────────────────────────────
function resolveSpintaxPreview(template: string): string {
  let result = template;
  for (let i = 0; i < 5; i++) {
    const prev = result;
    result = result.replace(/\{([^{}]*\|[^{}]*)\}/g, (_m, g: string) => {
      const opts = g.split("|");
      return opts[Math.floor(Math.random() * opts.length)];
    });
    if (result === prev) break;
  }
  return result
    .replace(/\{\{nombre\}\}/gi, "Juan")
    .replace(/\{\{email\}\}/gi, "juan@email.com")
    .replace(/\{\{whatsapp\}\}/gi, "+5491155551234")
    .replace(/\{\{telefono\}\}/gi, "+5491155551234")
    .replace(/\{\{ocupacion\}\}/gi, "Emprendedor")
    .replace(/\{\{recurso\}\}/gi, "Guía de IA");
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function BroadcastPage() {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [template, setTemplate] = useState("");
  const [preview, setPreview] = useState("");
  const [speed, setSpeed] = useState<SpeedPreset>("conservative");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>(["lead", "nutrido_bot"]);
  const [maxDays, setMaxDays] = useState(90);
  const [excludeOptedOut, setExcludeOptedOut] = useState(true);

  const { data: campaignsData, isLoading } = useQuery<{ campaigns: Campaign[] }>({
    queryKey: ["broadcasts"],
    queryFn: () => fetch("/api/admin/broadcast").then((r) => r.json()),
    refetchInterval: 5000,
  });

  const { data: sourcesData } = useQuery<{ sources: string[] }>({
    queryKey: ["broadcast-sources"],
    queryFn: () =>
      fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sources" }),
      }).then((r) => r.json()),
  });

  const audiencePreview = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "preview",
          filters: {
            sources: selectedSources.length > 0 ? selectedSources : undefined,
            funnelStages: selectedStages.length > 0 ? selectedStages : undefined,
            maxDaysOld: maxDays,
            excludeOptedOut,
          },
        }),
      });
      return res.json();
    },
  });

  useEffect(() => {
    const timeout = setTimeout(() => { audiencePreview.mutate(); }, 500);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSources, selectedStages, maxDays, excludeOptedOut]);

  const launchCampaign = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, template,
          filters: {
            sources: selectedSources.length > 0 ? selectedSources : undefined,
            funnelStages: selectedStages.length > 0 ? selectedStages : undefined,
            maxDaysOld: maxDays, excludeOptedOut,
          },
          rateConfig: SPEED_PRESETS[speed].config,
          launch: true,
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Error"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broadcasts"] });
      setName(""); setTemplate(""); setPreview("");
    },
  });

  const campaignAction = useMutation({
    mutationFn: async ({ campaignId, action }: { campaignId: string; action: string }) => {
      const res = await fetch("/api/admin/broadcast", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, action }),
      });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["broadcasts"] }); },
  });

  const regeneratePreview = useCallback(() => {
    if (template) setPreview(resolveSpintaxPreview(template));
  }, [template]);

  useEffect(() => {
    if (template) {
      const t = setTimeout(() => setPreview(resolveSpintaxPreview(template)), 300);
      return () => clearTimeout(t);
    } else { setPreview(""); }
  }, [template]);

  const campaigns = campaignsData?.campaigns || [];
  const sources = sourcesData?.sources || [];
  const audienceCount = audiencePreview.data?.count ?? "—";

  const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
    draft: { label: "Borrador", color: "text-gray-500 bg-gray-500/10", icon: Clock },
    sending: { label: "Enviando", color: "text-blue-500 bg-blue-500/10", icon: Loader2 },
    paused: { label: "Pausada", color: "text-amber-500 bg-amber-500/10", icon: Pause },
    completed: { label: "Completada", color: "text-emerald-500 bg-emerald-500/10", icon: CheckCircle2 },
    cancelled: { label: "Cancelada", color: "text-red-500 bg-red-500/10", icon: XCircle },
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
          <Megaphone className="w-7 h-7 text-[var(--accent)]" />
          Mensajes Masivos
        </h1>
        <p className="text-[var(--text-muted)] mt-1">
          Envía mensajes personalizados a tus leads con protección anti-bloqueo.
        </p>
      </div>

      {/* ─── Composer ─────────────────────────────────────────────────────────── */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)] shadow-sm overflow-hidden mb-8">
        <div className="p-6 space-y-6">
          {/* Campaign name */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Nombre de campaña
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Workshop Mayo 2026"
              className="w-full px-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          {/* Template */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Mensaje (con Spintax)
            </label>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder={`{Hola|Hey|Buenas} {{nombre}}! 👋\n\n{Te escribo|Me comunico} porque tenemos un workshop sobre IA.\n\n{¿Te interesa?|¿Quieres que te cuente más?}`}
              rows={6}
              className="w-full px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none font-mono"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {["{{nombre}}", "{{ocupacion}}", "{{recurso}}"].map((v) => (
                <button
                  key={v}
                  onClick={() => setTemplate((t) => t + " " + v)}
                  className="px-2 py-0.5 text-[10px] font-mono bg-[var(--accent)]/10 text-[var(--accent)] rounded-full border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 transition-colors"
                >
                  {v}
                </button>
              ))}
              <span className="text-[10px] text-[var(--text-muted)] self-center ml-2">
                Usa {"{opción1|opción2}"} para variantes
              </span>
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Vista previa
                </label>
                <button
                  onClick={regeneratePreview}
                  className="flex items-center gap-1 text-[10px] font-medium text-[var(--accent)] hover:underline"
                >
                  <RefreshCw className="w-3 h-3" /> Otra variante
                </button>
              </div>
              <div className="bg-gradient-to-br from-emerald-500/5 to-green-500/5 border border-emerald-500/20 rounded-[var(--radius-md)] p-4">
                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                  {preview}
                </p>
              </div>
            </div>
          )}

          {/* ─── Filters ──────────────────────────────────────────────────────── */}
          <div className="border-t border-[var(--border)] pt-6">
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Filtros de Audiencia
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sources */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Fuente</label>
                <div className="flex flex-wrap gap-1.5">
                  {sources.length === 0 ? (
                    <span className="text-[10px] text-[var(--text-muted)] italic">Todas</span>
                  ) : (
                    sources.map((src) => (
                      <button
                        key={src}
                        onClick={() =>
                          setSelectedSources((p) =>
                            p.includes(src) ? p.filter((s) => s !== src) : [...p, src]
                          )
                        }
                        className={`px-2 py-0.5 text-[10px] rounded-full border transition-colors ${
                          selectedSources.includes(src)
                            ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                            : "bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--accent)]"
                        }`}
                      >
                        {src.replace("lead_magnet:", "🎁 ")}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Funnel stage */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Etapa del embudo</label>
                <div className="flex flex-wrap gap-1.5">
                  {FUNNEL_STAGES.map((s) => (
                    <button
                      key={s.key}
                      onClick={() =>
                        setSelectedStages((p) =>
                          p.includes(s.key) ? p.filter((k) => k !== s.key) : [...p, s.key]
                        )
                      }
                      className={`px-2 py-0.5 text-[10px] rounded-full border transition-colors ${
                        selectedStages.includes(s.key)
                          ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                          : "bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--accent)]"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max days old */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                  Antigüedad máxima
                </label>
                <select
                  value={maxDays}
                  onChange={(e) => setMaxDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value={7}>Últimos 7 días</option>
                  <option value={14}>Últimos 14 días</option>
                  <option value={30}>Últimos 30 días</option>
                  <option value={60}>Últimos 60 días</option>
                  <option value={90}>Últimos 90 días</option>
                  <option value={365}>Último año</option>
                  <option value={9999}>Todos</option>
                </select>
              </div>

              {/* Exclude opted out */}
              <div className="flex items-center gap-3 self-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={excludeOptedOut}
                    onChange={(e) => setExcludeOptedOut(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--border)] accent-[var(--accent)]"
                  />
                  <span className="text-xs text-[var(--text-muted)]">Excluir leads que pidieron PARAR</span>
                </label>
              </div>
            </div>

            {/* Audience count */}
            <div className="mt-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--accent)]" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                Audiencia estimada: {audiencePreview.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin inline" />
                ) : (
                  <span className="text-[var(--accent)]">{audienceCount} leads</span>
                )}
              </span>
            </div>
          </div>

          {/* ─── Speed ────────────────────────────────────────────────────────── */}
          <div className="border-t border-[var(--border)] pt-6">
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Velocidad de Envío
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(SPEED_PRESETS) as [SpeedPreset, typeof SPEED_PRESETS[SpeedPreset]][]).map(
                ([key, preset]) => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setSpeed(key)}
                      className={`p-3 rounded-[var(--radius-md)] border text-left transition-all ${
                        speed === key
                          ? "border-[var(--accent)] bg-[var(--accent)]/5"
                          : "border-[var(--border)] hover:border-[var(--accent)]/50"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className={`w-3.5 h-3.5 ${speed === key ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`} />
                        <span className={`text-xs font-semibold ${speed === key ? "text-[var(--accent)]" : "text-[var(--text-primary)]"}`}>
                          {preset.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)]">{preset.desc}</p>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* ─── Actions ──────────────────────────────────────────────────────── */}
          <div className="border-t border-[var(--border)] pt-6 flex items-center gap-3">
            <button
              onClick={() => launchCampaign.mutate()}
              disabled={!name || !template || launchCampaign.isPending || audienceCount === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[var(--accent)] to-emerald-500 text-white font-semibold text-sm rounded-[var(--radius-md)] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {launchCampaign.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Enviar a {audienceCount} leads
            </button>
            {launchCampaign.isError && (
              <span className="text-xs text-red-500">
                {(launchCampaign.error as Error).message}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Campaign History ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Campañas Anteriores</h2>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)]">
            <Megaphone className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
            <p className="text-sm text-[var(--text-muted)]">No hay campañas todavía.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((c) => {
              const sc = statusConfig[c.status] || statusConfig.draft;
              const StatusIcon = sc.icon;
              const progress = c.totalRecipients > 0 ? Math.round(((c.sentCount + c.failedCount) / c.totalRecipients) * 100) : 0;

              return (
                <div
                  key={c.id}
                  className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4 hover:border-[var(--border-hover)] transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-sm text-[var(--text-primary)]">{c.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${sc.color}`}>
                        <StatusIcon className={`w-3 h-3 ${c.status === "sending" ? "animate-spin" : ""}`} />
                        {sc.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {format(new Date(c.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-[var(--bg-surface)] rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--accent)] to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[10px] text-[var(--text-muted)]">
                      <span>✅ {c.sentCount}/{c.totalRecipients} enviados</span>
                      {c.failedCount > 0 && <span className="text-red-500">❌ {c.failedCount} fallidos</span>}
                      {c.replyCount > 0 && <span className="text-emerald-500">📩 {c.replyCount} respuestas</span>}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      {c.status === "sending" && (
                        <button
                          onClick={() => campaignAction.mutate({ campaignId: c.id, action: "pause" })}
                          className="p-1.5 rounded-md hover:bg-amber-500/10 text-amber-500 transition-colors"
                          title="Pausar"
                        >
                          <Pause className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {c.status === "paused" && (
                        <button
                          onClick={() => campaignAction.mutate({ campaignId: c.id, action: "resume" })}
                          className="p-1.5 rounded-md hover:bg-emerald-500/10 text-emerald-500 transition-colors"
                          title="Reanudar"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {(c.status === "sending" || c.status === "paused") && (
                        <button
                          onClick={() => campaignAction.mutate({ campaignId: c.id, action: "cancel" })}
                          className="p-1.5 rounded-md hover:bg-red-500/10 text-red-500 transition-colors"
                          title="Cancelar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
