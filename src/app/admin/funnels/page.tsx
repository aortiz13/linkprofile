"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  GitBranch,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Link2,
  FlaskConical,
  Percent,
} from "lucide-react";
import { useState, useCallback } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Variant {
  key: string;
  label: string;
  path: string;
  weight: number;
}

interface ExtraLink {
  label: string;
  url: string;
}

interface Funnel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
  variants: Variant[];
  extraLinks: ExtraLink[];
  createdAt: string;
  updatedAt: string;
}

const BASE_URL = typeof window !== "undefined" ? window.location.origin : "";

// ─── Component ───────────────────────────────────────────────────────────────
export default function FunnelsPage() {
  const queryClient = useQueryClient();
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ funnels: Funnel[] }>({
    queryKey: ["funnels"],
    queryFn: () => fetch("/api/admin/funnels").then((r) => r.json()),
  });

  const updateFunnel = useMutation({
    mutationFn: async (payload: { id: string; active?: boolean; variants?: Variant[] }) => {
      const res = await fetch("/api/admin/funnels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Error updating");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["funnels"] }),
  });

  const copyUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  }, []);

  const handleWeightChange = (funnel: Funnel, variantKey: string, newWeight: number) => {
    const updatedVariants = funnel.variants.map((v) =>
      v.key === variantKey ? { ...v, weight: newWeight } : v
    );
    updateFunnel.mutate({ id: funnel.id, variants: updatedVariants });
  };

  const funnelsList = data?.funnels || [];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
          <FlaskConical className="w-7 h-7 text-[var(--accent)]" />
          Embudos de Venta
        </h1>
        <p className="text-[var(--text-muted)] mt-1">
          Controla qué embudos están activos y el % de tráfico para cada variante A/B.
        </p>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
        </div>
      ) : funnelsList.length === 0 ? (
        <div className="text-center py-16 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)]">
          <GitBranch className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
          <p className="text-sm text-[var(--text-muted)]">No hay embudos configurados.</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Ejecutá la migración SQL para crear los embudos.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {funnelsList.map((funnel) => {
            const totalWeight = funnel.variants.reduce((s, v) => s + v.weight, 0);
            const trafficUrl = `${BASE_URL}/api/funnel/${funnel.slug}`;

            return (
              <div
                key={funnel.id}
                className={`bg-[var(--bg-elevated)] border rounded-[var(--radius-xl)] shadow-sm overflow-hidden transition-all ${
                  funnel.active ? "border-[var(--accent)]/40" : "border-[var(--border)] opacity-70"
                }`}
              >
                {/* Funnel Header */}
                <div className="p-5 sm:p-6 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-lg font-bold text-[var(--text-primary)]">{funnel.name}</h2>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                          funnel.active
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-gray-500/10 text-gray-500"
                        }`}
                      >
                        {funnel.active ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    {funnel.description && (
                      <p className="text-sm text-[var(--text-muted)]">{funnel.description}</p>
                    )}
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => updateFunnel.mutate({ id: funnel.id, active: !funnel.active })}
                    disabled={updateFunnel.isPending}
                    className={`flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-all ${
                      funnel.active
                        ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                        : "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] border border-[var(--border)]"
                    }`}
                  >
                    {funnel.active ? (
                      <ToggleRight className="w-5 h-5" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                    {funnel.active ? "Encendido" : "Apagado"}
                  </button>
                </div>

                {/* Traffic URL */}
                <div className="px-5 sm:px-6 pb-4">
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5" /> URL de Tráfico (A/B Split)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] text-sm font-mono text-[var(--accent)] truncate">
                      {trafficUrl}
                    </div>
                    <button
                      onClick={() => copyUrl(trafficUrl)}
                      className="p-2 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
                      title="Copiar URL"
                    >
                      {copiedUrl === trafficUrl ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-[var(--text-muted)]" />
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
                    Compartí este enlace — redirige automáticamente según los pesos configurados.
                  </p>
                </div>

                {/* Variants A/B */}
                <div className="border-t border-[var(--border)] px-5 sm:px-6 py-5">
                  <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5" /> Variantes A/B
                  </h3>
                  <div className="space-y-3">
                    {funnel.variants.map((variant) => {
                      const pct = totalWeight > 0 ? Math.round((variant.weight / totalWeight) * 100) : 0;
                      const variantFullUrl = `${BASE_URL}${variant.path}`;

                      return (
                        <div
                          key={variant.key}
                          className="flex items-center gap-3 p-3 bg-[var(--bg-surface)] rounded-[var(--radius-md)] border border-[var(--border)]"
                        >
                          {/* Weight indicator bar */}
                          <div className="relative w-12 h-12 flex-shrink-0">
                            <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                              <circle
                                cx="18" cy="18" r="15.5"
                                fill="none"
                                stroke="var(--border)"
                                strokeWidth="3"
                              />
                              <circle
                                cx="18" cy="18" r="15.5"
                                fill="none"
                                stroke="var(--accent)"
                                strokeWidth="3"
                                strokeDasharray={`${pct} ${100 - pct}`}
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[var(--text-primary)]">
                              {pct}%
                            </span>
                          </div>

                          {/* Variant info */}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-[var(--text-primary)]">{variant.label}</div>
                            <div className="text-xs text-[var(--text-muted)] font-mono truncate">{variant.path}</div>
                          </div>

                          {/* Weight slider */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Percent className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={variant.weight}
                              onChange={(e) => handleWeightChange(funnel, variant.key, Number(e.target.value))}
                              className="w-24 accent-[var(--accent)]"
                            />
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={variant.weight}
                              onChange={(e) => handleWeightChange(funnel, variant.key, Number(e.target.value))}
                              className="w-14 px-2 py-1 text-xs text-center bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                            />
                          </div>

                          {/* Direct link buttons */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => copyUrl(variantFullUrl)}
                              className="p-1.5 rounded-md hover:bg-[var(--accent)]/10 transition-colors"
                              title="Copiar enlace directo"
                            >
                              {copiedUrl === variantFullUrl ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                              )}
                            </button>
                            <a
                              href={variant.path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-md hover:bg-[var(--accent)]/10 transition-colors"
                              title="Abrir en nueva pestaña"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Extra Links */}
                {funnel.extraLinks && (funnel.extraLinks as ExtraLink[]).length > 0 && (
                  <div className="border-t border-[var(--border)] px-5 sm:px-6 py-4">
                    <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5" /> Enlaces del Embudo
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(funnel.extraLinks as ExtraLink[]).map((link, i) => {
                        const fullUrl = link.url.startsWith("http") ? link.url : `${BASE_URL}${link.url}`;
                        return (
                          <div
                            key={i}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-full text-xs"
                          >
                            <span className="text-[var(--text-muted)]">{link.label}</span>
                            <button
                              onClick={() => copyUrl(fullUrl)}
                              className="p-0.5 hover:text-[var(--accent)] transition-colors"
                              title={fullUrl}
                            >
                              {copiedUrl === fullUrl ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3 text-[var(--text-muted)]" />
                              )}
                            </button>
                            <a
                              href={fullUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-0.5 hover:text-[var(--accent)] transition-colors"
                            >
                              <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
