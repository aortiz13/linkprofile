"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Users,
  Bot,
  UserCheck,
  CalendarCheck,
  Clock,
  Trophy,
  XCircle,
  ChevronRight,
  Phone,
  Mail,
  X,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  occupation: string | null;
  source: string | null;
  country: string | null;
  funnelStage: string;
  createdAt: string;
  waConversationId: string | null;
  waAgentActive: boolean | null;
  waStage: string | null;
}

interface LeadDetail {
  lead: Lead;
  conversation: {
    id: string;
    stage: string;
    active: boolean;
    qualificationScore: number;
    qualificationData: Record<string, unknown>;
    linkSent: boolean;
    linkClickedAt: string | null;
    messageCount: number;
  } | null;
  summary: string | null;
  messages: { role: string; content: string; createdAt: string }[];
}

const STAGES = [
  { key: "lead", label: "Lead", icon: Users, color: "from-slate-500 to-slate-600", dot: "bg-slate-500" },
  { key: "nutrido_bot", label: "Nutrido por Bot", icon: Bot, color: "from-blue-500 to-blue-600", dot: "bg-blue-500" },
  { key: "asesor_humano", label: "Asesor Humano", icon: UserCheck, color: "from-purple-500 to-purple-600", dot: "bg-purple-500" },
  { key: "reunion_agendada", label: "Reunión Agendada", icon: CalendarCheck, color: "from-amber-500 to-amber-600", dot: "bg-amber-500" },
  { key: "seguimiento", label: "Seguimiento", icon: Clock, color: "from-cyan-500 to-cyan-600", dot: "bg-cyan-500" },
  { key: "cierre_ganado", label: "Cierre Ganado", icon: Trophy, color: "from-emerald-500 to-emerald-600", dot: "bg-emerald-500" },
  { key: "cierre_perdido", label: "Cierre Perdido", icon: XCircle, color: "from-red-500 to-red-600", dot: "bg-red-500" },
];

export default function PipelinePage() {
  const queryClient = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ success: boolean; leads: Lead[] }>({
    queryKey: ["leads"],
    queryFn: () => fetch("/api/admin/leads").then((r) => r.json()),
  });

  const { data: detail, isLoading: loadingDetail } = useQuery<LeadDetail>({
    queryKey: ["lead-detail", selectedLead],
    queryFn: () =>
      fetch(`/api/admin/pipeline?leadId=${selectedLead}`).then((r) => r.json()),
    enabled: !!selectedLead,
  });

  const moveStage = useMutation({
    mutationFn: async ({ leadId, stage }: { leadId: string; stage: string }) => {
      const res = await fetch("/api/admin/pipeline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, stage }),
      });
      if (!res.ok) throw new Error("Failed to move");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const allLeads = data?.leads || [];

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 w-full">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Embudo de Ventas
        </h1>
        <p className="text-[var(--text-muted)] mt-1">
          Gestiona el progreso de cada lead a través del pipeline.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 180px)" }}>
          {STAGES.map((stage) => {
            const stageLeads = allLeads.filter((l) => (l.funnelStage || "lead") === stage.key);
            const Icon = stage.icon;
            return (
              <div
                key={stage.key}
                className="flex-shrink-0 w-[240px] flex flex-col bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl overflow-hidden"
              >
                {/* Column header */}
                <div className={`px-3 py-2.5 bg-gradient-to-r ${stage.color} text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span className="font-semibold text-xs">{stage.label}</span>
                    </div>
                    <span className="text-xs bg-white/20 rounded-full px-2 py-0.5 font-medium">
                      {stageLeads.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-260px)]">
                  {stageLeads.length === 0 ? (
                    <div className="text-center py-8 text-[var(--text-muted)] text-xs opacity-50">
                      Sin leads
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => setSelectedLead(lead.id)}
                        className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-3 cursor-pointer hover:border-[var(--accent)] hover:shadow-sm transition-all group"
                      >
                        <p className="font-semibold text-sm text-[var(--text-primary)] truncate">
                          {lead.name}
                        </p>
                        {lead.occupation && (
                          <p className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate">
                            💼 {lead.occupation}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {lead.phone && (
                            <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                              <Phone className="w-3 h-3" />
                            </div>
                          )}
                          {lead.email && (
                            <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                              <Mail className="w-3 h-3" />
                            </div>
                          )}
                          {lead.source && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 truncate max-w-[100px]">
                              {lead.source.replace("lead_magnet:", "")}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[9px] text-[var(--text-muted)]">
                            {format(new Date(lead.createdAt), "dd MMM", { locale: es })}
                          </span>
                          <ChevronRight className="w-3 h-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lead detail drawer */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedLead(null)}
          />
          <div className="relative w-full max-w-lg bg-[var(--bg-elevated)] border-l border-[var(--border)] shadow-2xl overflow-y-auto animate-in slide-in-from-right">
            <div className="sticky top-0 bg-[var(--bg-elevated)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Detalle del Lead</h2>
              <button onClick={() => setSelectedLead(null)} className="p-1 hover:bg-[var(--bg-surface)] rounded-lg transition-colors">
                <X className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
              </div>
            ) : detail ? (
              <div className="p-6 space-y-6">
                {/* Lead info */}
                <div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">{detail.lead.name}</h3>
                  {detail.lead.occupation && (
                    <p className="text-sm text-[var(--text-muted)] mt-0.5">💼 {detail.lead.occupation}</p>
                  )}
                  <div className="flex flex-col gap-1.5 mt-3">
                    {detail.lead.phone && (
                      <a
                        href={`https://wa.me/${detail.lead.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-500 hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5" /> {detail.lead.phone}
                      </a>
                    )}
                    {detail.lead.email && (
                      <a href={`mailto:${detail.lead.email}`} className="flex items-center gap-2 text-sm text-blue-500 hover:underline">
                        <Mail className="w-3.5 h-3.5" /> {detail.lead.email}
                      </a>
                    )}
                  </div>
                </div>

                {/* Move stage */}
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Mover a etapa</label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {STAGES.map((s) => {
                      const isCurrent = (detail.lead.funnelStage || "lead") === s.key;
                      return (
                        <button
                          key={s.key}
                          disabled={isCurrent || moveStage.isPending}
                          onClick={() => moveStage.mutate({ leadId: detail.lead.id, stage: s.key })}
                          className={`px-2.5 py-1 text-[10px] font-medium rounded-full border transition-all ${
                            isCurrent
                              ? `bg-gradient-to-r ${s.color} text-white border-transparent`
                              : "bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Conversation stats */}
                {detail.conversation && (
                  <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Conversación con Bot</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-[var(--text-muted)] text-xs">Mensajes</span>
                        <p className="font-semibold text-[var(--text-primary)]">{detail.conversation.messageCount}</p>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)] text-xs">Score</span>
                        <p className="font-semibold text-[var(--text-primary)]">{detail.conversation.qualificationScore}/100</p>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)] text-xs">Link enviado</span>
                        <p className="font-semibold text-[var(--text-primary)]">{detail.conversation.linkSent ? "✅ Sí" : "❌ No"}</p>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)] text-xs">Bot activo</span>
                        <p className="font-semibold text-[var(--text-primary)]">{detail.conversation.active ? "🟢 Sí" : "🔴 No"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Summary */}
                {detail.summary && (
                  <div className="bg-gradient-to-br from-[var(--accent)]/5 to-purple-500/5 border border-[var(--accent)]/20 rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Resumen de la conversación
                    </h4>
                    <div className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                      {detail.summary}
                    </div>
                  </div>
                )}

                {/* Chat history */}
                {detail.messages && detail.messages.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Historial de Chat</h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {detail.messages.map((msg, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-xl text-sm ${
                            msg.role === "user"
                              ? "bg-blue-500/10 border border-blue-500/20 ml-4"
                              : "bg-[var(--bg-surface)] border border-[var(--border)] mr-4"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-semibold uppercase ${msg.role === "user" ? "text-blue-500" : "text-[var(--text-muted)]"}`}>
                              {msg.role === "user" ? "Lead" : "Adrian (Bot)"}
                            </span>
                            <span className="text-[9px] text-[var(--text-muted)]">
                              {format(new Date(msg.createdAt), "dd/MM HH:mm", { locale: es })}
                            </span>
                          </div>
                          <p className="text-[var(--text-primary)] whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
