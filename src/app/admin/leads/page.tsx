"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Users, Mail, Phone, MessageSquare, Calendar, Globe, Tag } from "lucide-react";
import { useState } from "react";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  source: string | null;
  country: string | null;
  createdAt: string;
}

export default function LeadsPage() {
  const { data, isLoading } = useQuery<{ success: boolean; leads: Lead[] }>({
    queryKey: ["leads"],
    queryFn: () => fetch("/api/admin/leads").then((res) => res.json()),
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
                      {lead.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline" onClick={(e) => e.stopPropagation()}>
                            {lead.phone}
                          </a>
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
