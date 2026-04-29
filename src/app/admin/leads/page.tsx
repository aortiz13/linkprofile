"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Users, Mail, Phone, MessageSquare, Calendar, Globe, Tag, CheckCircle2, XCircle, Clock, Bot } from "lucide-react";
import { useState } from "react";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  occupation: string | null;
  message: string | null;
  source: string | null;
  country: string | null;
  whatsappStatus: string | null;
  whatsappError: string | null;
  whatsappSentAt: string | null;
  createdAt: string;
  waConversationId: string | null;
  waAgentActive: boolean | null;
  waStage: string | null;
}

export default function LeadsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<{ success: boolean; leads: Lead[] }>({
    queryKey: ["leads"],
    queryFn: () => fetch("/api/admin/leads").then((res) => res.json()),
  });

  const toggleAgent = useMutation({
    mutationFn: async ({ conversationId, active }: { conversationId: string; active: boolean }) => {
      const res = await fetch("/api/admin/wa-agent-toggle", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, active }),
      });
      if (!res.ok) throw new Error(`Toggle failed: ${res.status}`);
      return res.json();
    },
    onMutate: async ({ conversationId, active }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["leads"] });
      const previous = queryClient.getQueryData(["leads"]);
      queryClient.setQueryData(["leads"], (old: { success: boolean; leads: Lead[] } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          leads: old.leads.map((l) =>
            l.waConversationId === conversationId
              ? { ...l, waAgentActive: active, waStage: active ? "greeting" : "inactive" }
              : l
          ),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["leads"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<string>("all");

  const allLeads = data?.leads || [];

  // Get unique sources for filter
  const sources = Array.from(new Set(allLeads.map((l) => l.source).filter(Boolean))) as string[];

  const leads = filterSource === "all" ? allLeads : allLeads.filter((l) => l.source === filterSource);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 w-full">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Leads
        </h1>
        <p className="text-[var(--text-muted)] mt-1">
          Gestiona los contactos capturados a través de formularios y lead magnets.
        </p>
      </div>

      {/* Filter by source */}
      {sources.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs font-medium text-[var(--text-muted)]">Filtrar:</span>
          <button
            onClick={() => setFilterSource("all")}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              filterSource === "all"
                ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                : "bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--accent)]"
            }`}
          >
            Todos ({allLeads.length})
          </button>
          {sources.map((src) => (
            <button
              key={src}
              onClick={() => setFilterSource(src)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                filterSource === src
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                  : "bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--accent)]"
              }`}
            >
              {src.replace("lead_magnet:", "🎁 ")} ({allLeads.filter((l) => l.source === src).length})
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-20 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)] shadow-sm">
          <div className="w-16 h-16 bg-[var(--bg-surface)] rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-[var(--text-muted)]" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">
            Aún no tienes leads
          </h3>
          <p className="text-[var(--text-muted)] max-w-sm mx-auto">
            Cuando los usuarios llenen el formulario de contacto o un lead magnet, aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)] shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[var(--text-primary)]">
              <thead className="bg-[var(--bg-surface)] text-[var(--text-muted)] text-xs uppercase font-medium">
                <tr>
                  <th className="px-6 py-4 rounded-tl-[var(--radius-lg)]">Nombre</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4">Fuente</th>
                  <th className="px-6 py-4">Mensaje</th>
                  <th className="px-6 py-4">WA Auto</th>
                  <th className="px-6 py-4">Agente</th>
                  <th className="px-6 py-4 rounded-tr-[var(--radius-lg)]">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-[var(--bg-surface)]/50 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-semibold">{lead.name}</p>
                      {lead.country && (
                        <div className="flex items-center gap-1 mt-0.5 text-[var(--text-muted)]">
                          <Globe className="w-3 h-3" />
                          <span className="text-[10px] uppercase">{lead.country}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {lead.email && (
                        <div className="flex items-center gap-2 mb-1">
                          <Mail className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <a href={`mailto:${lead.email}`} className="text-blue-500 hover:underline" onClick={(e) => e.stopPropagation()}>{lead.email}</a>
                        </div>
                      )}
                      {lead.phone && (() => {
                        const cleanPhone = lead.phone.replace(/[^0-9]/g, "");
                        const leadMagnetName = lead.source?.startsWith("lead_magnet:") ? lead.source.replace("lead_magnet:", "") : null;
                        const firstName = lead.name?.split(" ")[0] || "";
                        const waMessage = leadMagnetName
                          ? `¡Hola${firstName ? ` ${firstName}` : ""}! 👋 Vi que descargaste el recurso "${leadMagnetName}". ¿Qué te pareció? ¿Tienes alguna duda?`
                          : `¡Hola${firstName ? ` ${firstName}` : ""}! 👋 ¿Cómo estás?`;
                        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;
                        return (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline" onClick={(e) => e.stopPropagation()}>
                              {lead.phone}
                            </a>
                          </div>
                        );
                      })()}
                      {lead.occupation && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-purple-500/10 text-purple-500">💼 {lead.occupation}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lead.source ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-teal-500/10 text-teal-600">
                          <Tag className="w-3 h-3" />
                          {lead.source.replace("lead_magnet:", "")}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[var(--text-muted)] italic">Formulario</span>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      {lead.message ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 mt-0.5" />
                            <p className={`text-[var(--text-muted)] ${expandedId === lead.id ? "break-words whitespace-pre-wrap" : "truncate"}`}>
                              {lead.message}
                            </p>
                          </div>
                          {lead.message.length > 50 && expandedId !== lead.id && (
                            <span className="text-[10px] uppercase font-semibold text-[var(--accent)] ml-5 tracking-wide">
                              Ver más
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[var(--text-muted)] opacity-50 italic">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lead.whatsappStatus === "sent" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-500/10 text-emerald-600">
                          <CheckCircle2 className="w-3 h-3" /> Enviado
                        </span>
                      ) : lead.whatsappStatus === "pending" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-500/10 text-amber-600">
                          <Clock className="w-3 h-3" /> Pendiente
                        </span>
                      ) : lead.whatsappStatus === "error" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-red-500/10 text-red-500 cursor-help" title={lead.whatsappError || "Error desconocido"}>
                          <XCircle className="w-3 h-3" /> Error
                        </span>
                      ) : (
                        <span className="text-[10px] text-[var(--text-muted)] opacity-50">—</span>
                      )}
                    </td>
                    {/* Agent toggle switch */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lead.waConversationId ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() =>
                              toggleAgent.mutate({
                                conversationId: lead.waConversationId!,
                                active: !lead.waAgentActive,
                              })
                            }
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                              lead.waAgentActive
                                ? "bg-emerald-500"
                                : "bg-[var(--border)]"
                            }`}
                            title={lead.waAgentActive ? "Agente activo — click para desactivar" : "Agente inactivo — click para activar"}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                                lead.waAgentActive ? "translate-x-[18px]" : "translate-x-[3px]"
                              }`}
                            />
                          </button>
                          <Bot className={`w-3.5 h-3.5 ${lead.waAgentActive ? "text-emerald-500" : "text-[var(--text-muted)] opacity-40"}`} />
                        </div>
                      ) : (
                        <span className="text-[10px] text-[var(--text-muted)] opacity-50">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-[var(--text-muted)]">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(lead.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
