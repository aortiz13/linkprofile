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
  { key: "lead", label: "Lead", icon: Users, gradient: "linear-gradient(135deg, #64748b, #475569)", bg: "#64748b" },
  { key: "nutrido_bot", label: "Nutrido por Bot", icon: Bot, gradient: "linear-gradient(135deg, #3b82f6, #2563eb)", bg: "#3b82f6" },
  { key: "asesor_humano", label: "Asesor Humano", icon: UserCheck, gradient: "linear-gradient(135deg, #a855f7, #9333ea)", bg: "#a855f7" },
  { key: "reunion_agendada", label: "Reunión Agendada", icon: CalendarCheck, gradient: "linear-gradient(135deg, #f59e0b, #d97706)", bg: "#f59e0b" },
  { key: "seguimiento", label: "Seguimiento", icon: Clock, gradient: "linear-gradient(135deg, #06b6d4, #0891b2)", bg: "#06b6d4" },
  { key: "cierre_ganado", label: "Cierre Ganado", icon: Trophy, gradient: "linear-gradient(135deg, #10b981, #059669)", bg: "#10b981" },
  { key: "cierre_perdido", label: "Cierre Perdido", icon: XCircle, gradient: "linear-gradient(135deg, #ef4444, #dc2626)", bg: "#ef4444" },
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
      queryClient.invalidateQueries({ queryKey: ["lead-detail", selectedLead] });
    },
  });

  const allLeads = data?.leads || [];

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .drawer-overlay {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .drawer-panel {
          animation: slideInRight 0.25s ease-out forwards;
        }
      `}</style>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "16px 24px", width: "100%" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
            Embudo de Ventas
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: 4, fontSize: 14 }}>
            Gestiona el progreso de cada lead a través del pipeline.
          </p>
        </div>

        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 256 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              border: "2px solid var(--border)", borderTopColor: "var(--accent)",
              animation: "spin 1s linear infinite",
            }} />
          </div>
        ) : (
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 16, minHeight: "calc(100vh - 180px)" }}>
            {STAGES.map((stage) => {
              const stageLeads = allLeads.filter((l) => (l.funnelStage || "lead") === stage.key);
              const Icon = stage.icon;
              return (
                <div
                  key={stage.key}
                  style={{
                    flexShrink: 0, width: 240, display: "flex", flexDirection: "column",
                    background: "var(--bg-elevated)", border: "1px solid var(--border)",
                    borderRadius: 12, overflow: "hidden",
                  }}
                >
                  {/* Column header */}
                  <div style={{ padding: "10px 12px", background: stage.gradient, color: "white" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Icon style={{ width: 16, height: 16 }} />
                        <span style={{ fontWeight: 600, fontSize: 12 }}>{stage.label}</span>
                      </div>
                      <span style={{
                        fontSize: 11, background: "rgba(255,255,255,0.25)", borderRadius: 99,
                        padding: "2px 8px", fontWeight: 500,
                      }}>
                        {stageLeads.length}
                      </span>
                    </div>
                  </div>

                  {/* Cards */}
                  <div style={{ flex: 1, padding: 8, overflowY: "auto", maxHeight: "calc(100vh - 260px)" }}>
                    {stageLeads.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 12, opacity: 0.5 }}>
                        Sin leads
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {stageLeads.map((lead) => (
                          <div
                            key={lead.id}
                            onClick={() => setSelectedLead(lead.id)}
                            style={{
                              background: "var(--bg-surface)", border: "1px solid var(--border)",
                              borderRadius: 8, padding: 12, cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = "var(--accent)";
                              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "var(--border)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            <p style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {lead.name}
                            </p>
                            {lead.occupation && (
                              <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                                💼 {lead.occupation}
                              </p>
                            )}
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                              {lead.phone && <Phone style={{ width: 12, height: 12, color: "var(--text-muted)" }} />}
                              {lead.email && <Mail style={{ width: 12, height: 12, color: "var(--text-muted)" }} />}
                              {lead.source && (
                                <span style={{
                                  fontSize: 9, padding: "2px 6px", borderRadius: 99,
                                  background: "rgba(20, 184, 166, 0.1)", color: "#0d9488",
                                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 100,
                                }}>
                                  {lead.source.replace("lead_magnet:", "")}
                                </span>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                              <span style={{ fontSize: 9, color: "var(--text-muted)" }}>
                                {format(new Date(lead.createdAt), "dd MMM", { locale: es })}
                              </span>
                              <ChevronRight style={{ width: 12, height: 12, color: "var(--text-muted)", opacity: 0.4 }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lead detail drawer */}
      {selectedLead && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", justifyContent: "flex-end" }}>
          {/* Backdrop */}
          <div
            className="drawer-overlay"
            onClick={() => setSelectedLead(null)}
            style={{
              position: "absolute", inset: 0,
              background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
            }}
          />

          {/* Panel */}
          <div
            className="drawer-panel"
            style={{
              position: "relative", width: "100%", maxWidth: 480,
              background: "var(--bg-elevated, #fff)",
              borderLeft: "1px solid var(--border, #e5e7eb)",
              boxShadow: "-8px 0 30px rgba(0,0,0,0.15)",
              overflowY: "auto",
            }}
          >
            {/* Header */}
            <div style={{
              position: "sticky", top: 0, zIndex: 10,
              background: "var(--bg-elevated, #fff)",
              borderBottom: "1px solid var(--border, #e5e7eb)",
              padding: "16px 24px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary, #111)" }}>Detalle del Lead</h2>
              <button
                onClick={() => setSelectedLead(null)}
                style={{
                  padding: 4, borderRadius: 8, border: "none", cursor: "pointer",
                  background: "transparent", display: "flex",
                }}
              >
                <X style={{ width: 20, height: 20, color: "var(--text-muted, #888)" }} />
              </button>
            </div>

            {loadingDetail ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
                <Loader2 style={{ width: 24, height: 24, color: "var(--accent)", animation: "spin 1s linear infinite" }} />
              </div>
            ) : detail ? (
              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Lead info */}
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary, #111)" }}>{detail.lead.name}</h3>
                  {detail.lead.occupation && (
                    <p style={{ fontSize: 13, color: "var(--text-muted, #888)", marginTop: 2 }}>💼 {detail.lead.occupation}</p>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
                    {detail.lead.phone && (
                      <a
                        href={`https://wa.me/${detail.lead.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#3b82f6", textDecoration: "none" }}
                      >
                        <Phone style={{ width: 14, height: 14 }} /> {detail.lead.phone}
                      </a>
                    )}
                    {detail.lead.email && (
                      <a href={`mailto:${detail.lead.email}`} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#3b82f6", textDecoration: "none" }}>
                        <Mail style={{ width: 14, height: 14 }} /> {detail.lead.email}
                      </a>
                    )}
                  </div>
                </div>

                {/* Move stage */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted, #888)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Mover a etapa
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {STAGES.map((s) => {
                      const isCurrent = (detail.lead.funnelStage || "lead") === s.key;
                      return (
                        <button
                          key={s.key}
                          disabled={isCurrent || moveStage.isPending}
                          onClick={() => moveStage.mutate({ leadId: detail.lead.id, stage: s.key })}
                          style={{
                            padding: "4px 10px", fontSize: 10, fontWeight: 500,
                            borderRadius: 99, border: isCurrent ? "none" : "1px solid var(--border, #e5e7eb)",
                            background: isCurrent ? s.gradient : "transparent",
                            color: isCurrent ? "white" : "var(--text-muted, #888)",
                            cursor: isCurrent ? "default" : "pointer",
                            opacity: isCurrent ? 1 : 0.8,
                            transition: "all 0.15s ease",
                          }}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Conversation stats */}
                {detail.conversation && (
                  <div style={{
                    background: "var(--bg-surface, #f9fafb)", border: "1px solid var(--border, #e5e7eb)",
                    borderRadius: 12, padding: 16,
                  }}>
                    <h4 style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted, #888)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
                      Conversación con Bot
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
                      <div>
                        <span style={{ color: "var(--text-muted, #888)", fontSize: 11 }}>Mensajes</span>
                        <p style={{ fontWeight: 600, color: "var(--text-primary, #111)" }}>{detail.conversation.messageCount}</p>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-muted, #888)", fontSize: 11 }}>Score</span>
                        <p style={{ fontWeight: 600, color: "var(--text-primary, #111)" }}>{detail.conversation.qualificationScore}/100</p>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-muted, #888)", fontSize: 11 }}>Link enviado</span>
                        <p style={{ fontWeight: 600, color: "var(--text-primary, #111)" }}>{detail.conversation.linkSent ? "✅ Sí" : "❌ No"}</p>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-muted, #888)", fontSize: 11 }}>Bot activo</span>
                        <p style={{ fontWeight: 600, color: "var(--text-primary, #111)" }}>{detail.conversation.active ? "🟢 Sí" : "🔴 No"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Summary */}
                {detail.summary && (
                  <div style={{
                    background: "linear-gradient(135deg, rgba(59,130,246,0.05), rgba(168,85,247,0.05))",
                    border: "1px solid rgba(59,130,246,0.15)", borderRadius: 12, padding: 16,
                  }}>
                    <h4 style={{
                      fontSize: 11, fontWeight: 600, color: "var(--accent, #3b82f6)",
                      textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8,
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      <MessageSquare style={{ width: 14, height: 14 }} />
                      Resumen de la conversación
                    </h4>
                    <div style={{ fontSize: 13, color: "var(--text-primary, #111)", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                      {detail.summary}
                    </div>
                  </div>
                )}

                {/* Chat history */}
                {detail.messages && detail.messages.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted, #888)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
                      Historial de Chat
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 384, overflowY: "auto" }}>
                      {detail.messages.map((msg, i) => (
                        <div
                          key={i}
                          style={{
                            padding: 12, borderRadius: 12, fontSize: 13,
                            background: msg.role === "user" ? "rgba(59,130,246,0.08)" : "var(--bg-surface, #f9fafb)",
                            border: `1px solid ${msg.role === "user" ? "rgba(59,130,246,0.15)" : "var(--border, #e5e7eb)"}`,
                            marginLeft: msg.role === "user" ? 16 : 0,
                            marginRight: msg.role === "user" ? 0 : 16,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: msg.role === "user" ? "#3b82f6" : "var(--text-muted, #888)" }}>
                              {msg.role === "user" ? "Lead" : "Adrian (Bot)"}
                            </span>
                            <span style={{ fontSize: 9, color: "var(--text-muted, #888)" }}>
                              {format(new Date(msg.createdAt), "dd/MM HH:mm", { locale: es })}
                            </span>
                          </div>
                          <p style={{ color: "var(--text-primary, #111)", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>{msg.content}</p>
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
    </>
  );
}
