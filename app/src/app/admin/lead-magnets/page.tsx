"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift, Plus, Loader2, Save, Check, Trash2, ExternalLink,
  ChevronDown, Copy, Eye, EyeOff, X, Pencil, MessageCircle,
} from "lucide-react";

interface LeadMagnetData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  buttonText: string;
  resourceUrl: string;
  coverImage: string | null;
  showName: boolean;
  showEmail: boolean;
  showWhatsapp: boolean;
  showOccupation: boolean;
  occupationOptions: string[];
  whatsappEnabled: boolean;
  whatsappMessage: string | null;
  whatsappDelay: number;
  active: boolean;
  createdAt: string;
}

type FormData = {
  slug: string;
  title: string;
  description: string;
  buttonText: string;
  resourceUrl: string;
  showName: boolean;
  showEmail: boolean;
  showWhatsapp: boolean;
  showOccupation: boolean;
  occupationOptions: string[];
  whatsappEnabled: boolean;
  whatsappMessage: string;
  whatsappDelay: number;
};

const EMPTY_FORM: FormData = {
  slug: "", title: "", description: "", buttonText: "Obtener recurso gratis",
  resourceUrl: "", showName: true, showEmail: true, showWhatsapp: true,
  showOccupation: true,
  occupationOptions: ["Emprendedor", "Empresario", "Freelancer", "Empleado", "Estudiante", "Otro"],
  whatsappEnabled: false, whatsappMessage: "", whatsappDelay: 0,
};

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between p-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl cursor-pointer hover:border-[var(--border-hover)] transition-colors">
      <span className="text-sm text-[var(--text-primary)]">{label}</span>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </label>
  );
}

export default function LeadMagnetsPage() {
  const [magnets, setMagnets] = useState<LeadMagnetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [newOccupation, setNewOccupation] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const fetchMagnets = async () => {
    try {
      const res = await fetch("/api/admin/lead-magnets");
      const data = await res.json();
      if (data.success) setMagnets(data.leadMagnets || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchMagnets(); }, []);

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setError("");
  };

  const handleSave = async () => {
    if (!form.slug || !form.title || !form.resourceUrl) {
      setError("Slug, título y URL del recurso son obligatorios"); return;
    }
    setSaving(true); setError("");
    try {
      const url = editingId ? `/api/admin/lead-magnets/${editingId}` : "/api/admin/lead-magnets";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al guardar"); return; }
      setShowForm(false); setEditingId(null); setForm(EMPTY_FORM);
      fetchMagnets();
    } catch { setError("Error de conexión"); } finally { setSaving(false); }
  };

  const handleEdit = (m: LeadMagnetData) => {
    setForm({
      slug: m.slug, title: m.title, description: m.description || "",
      buttonText: m.buttonText, resourceUrl: m.resourceUrl,
      showName: m.showName, showEmail: m.showEmail, showWhatsapp: m.showWhatsapp,
      showOccupation: m.showOccupation, occupationOptions: m.occupationOptions || [],
      whatsappEnabled: m.whatsappEnabled ?? false,
      whatsappMessage: m.whatsappMessage || "",
      whatsappDelay: m.whatsappDelay ?? 0,
    });
    setEditingId(m.id); setShowForm(true); setError("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este lead magnet?")) return;
    await fetch(`/api/admin/lead-magnets/${id}`, { method: "DELETE" });
    fetchMagnets();
  };

  const handleToggleActive = async (m: LeadMagnetData) => {
    await fetch(`/api/admin/lead-magnets/${m.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !m.active }),
    });
    fetchMagnets();
  };

  const copyUrl = (slug: string) => {
    navigator.clipboard.writeText(`${baseUrl}/lm/${slug}`);
    setCopied(slug); setTimeout(() => setCopied(""), 2000);
  };

  const addOccupation = () => {
    if (newOccupation.trim() && !form.occupationOptions.includes(newOccupation.trim())) {
      updateField("occupationOptions", [...form.occupationOptions, newOccupation.trim()]);
      setNewOccupation("");
    }
  };

  const removeOccupation = (opt: string) => {
    updateField("occupationOptions", form.occupationOptions.filter(o => o !== opt));
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-cyan-500/20 flex items-center justify-center">
            <Gift className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Lead Magnets</h1>
            <p className="text-sm text-[var(--text-muted)]">Configura formularios para captar leads desde TikTok e Instagram</p>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); setError(""); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:brightness-110 transition-all shadow-lg shadow-[var(--accent)]/20"
        >
          <Plus className="w-4 h-4" /> Nuevo
        </button>
      </div>

      {/* List */}
      {magnets.length === 0 && !showForm ? (
        <div className="text-center py-20 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl">
          <div className="w-16 h-16 bg-[var(--bg-surface)] rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-[var(--text-muted)]" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Aún no tienes lead magnets</h3>
          <p className="text-[var(--text-muted)] max-w-sm mx-auto mb-6">
            Crea tu primer lead magnet para captar leads desde tus redes sociales.
          </p>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); }}
            className="px-6 py-3 rounded-xl bg-[var(--accent)] text-white font-medium hover:brightness-110 transition-all"
          >
            <Plus className="w-4 h-4 inline mr-2" /> Crear Lead Magnet
          </button>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {magnets.map((m) => (
            <div key={m.id} className="border border-[var(--border)] rounded-2xl bg-[var(--bg-surface)] overflow-hidden transition-all hover:border-[var(--border-hover)]">
              <div className="flex items-center gap-4 p-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.active ? "bg-emerald-500/10" : "bg-neutral-500/10"}`}>
                  <Gift className={`w-5 h-5 ${m.active ? "text-emerald-500" : "text-neutral-400"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">{m.title}</h3>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${m.active ? "bg-emerald-500/15 text-emerald-500" : "bg-neutral-500/15 text-neutral-400"}`}>
                      {m.active ? "ACTIVO" : "INACTIVO"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[var(--text-muted)] font-mono">/lm/{m.slug}</span>
                    <button onClick={() => copyUrl(m.slug)} className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                      {copied === m.slug ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleToggleActive(m)} className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition-colors" title={m.active ? "Desactivar" : "Activar"}>
                    {m.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <a href={`/lm/${m.slug}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition-colors" title="Ver página">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button onClick={() => handleEdit(m)} className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition-colors" title="Editar">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="p-2 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setExpandedId(expandedId === m.id ? null : m.id)} className={`p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition-all ${expandedId === m.id ? "rotate-180" : ""}`}>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <AnimatePresence>
                {expandedId === m.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-4 pt-0 border-t border-[var(--border)]">
                      <div className="pt-3 grid grid-cols-2 gap-3 text-xs">
                        <div><span className="text-[var(--text-muted)]">Recurso:</span> <a href={m.resourceUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline break-all">{m.resourceUrl}</a></div>
                        <div><span className="text-[var(--text-muted)]">URL pública:</span> <span className="font-mono text-[var(--text-primary)]">{baseUrl}/lm/{m.slug}</span></div>
                        <div><span className="text-[var(--text-muted)]">Campos:</span> <span className="text-[var(--text-primary)]">
                          {[m.showName && "Nombre", m.showEmail && "Email", m.showWhatsapp && "WhatsApp", m.showOccupation && "Ocupación"].filter(Boolean).join(", ")}
                        </span></div>
                        {m.showOccupation && <div><span className="text-[var(--text-muted)]">Opciones ocupación:</span> <span className="text-[var(--text-primary)]">{(m.occupationOptions || []).join(", ")}</span></div>}
                        <div className="col-span-2 flex items-center gap-2 mt-1">
                          <MessageCircle className={`w-3.5 h-3.5 ${m.whatsappEnabled ? "text-emerald-500" : "text-[var(--text-muted)]"}`} />
                          <span className={`text-xs font-medium ${m.whatsappEnabled ? "text-emerald-500" : "text-[var(--text-muted)]"}`}>
                            {m.whatsappEnabled ? `WA activo — ${m.whatsappDelay === 0 ? "Enseguida" : `${m.whatsappDelay / 60} min`}` : "WA desactivado"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); setEditingId(null); } }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
            >
              <div className="sticky top-0 bg-[var(--bg-surface)] border-b border-[var(--border)] p-5 flex items-center justify-between z-10 rounded-t-2xl">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  {editingId ? "Editar Lead Magnet" : "Nuevo Lead Magnet"}
                </h2>
                <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Slug */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-primary)] mb-1 block">URL del formulario (slug)</label>
                  <div className="flex items-center gap-0 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl overflow-hidden focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/20 transition-all">
                    <span className="pl-3 text-xs text-[var(--text-muted)] whitespace-nowrap">/lm/</span>
                    <input
                      value={form.slug} onChange={(e) => updateField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      placeholder="mi-recurso-gratis" className="flex-1 px-1 py-2.5 bg-transparent text-sm text-[var(--text-primary)] focus:outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">Solo letras minúsculas, números y guiones. Ej: mi-guia-ia</p>
                </div>

                {/* Title */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-primary)] mb-1 block">Título</label>
                  <input value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="Descarga tu guía gratuita de IA"
                    className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all" />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-primary)] mb-1 block">Descripción (opcional)</label>
                  <textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} rows={2} placeholder="Breve descripción de lo que va a recibir..."
                    className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] resize-none" />
                </div>

                {/* Button Text */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-primary)] mb-1 block">Texto del botón</label>
                  <input value={form.buttonText} onChange={(e) => updateField("buttonText", e.target.value)} placeholder="Obtener recurso gratis"
                    className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]" />
                </div>

                {/* Resource URL */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-primary)] mb-1 block">URL del recurso (Google Drive, etc.)</label>
                  <input value={form.resourceUrl} onChange={(e) => updateField("resourceUrl", e.target.value)} placeholder="https://drive.google.com/..."
                    className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]" />
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">Se mostrará al usuario después de completar el formulario.</p>
                </div>

                {/* Form Fields */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-primary)] mb-2 block">Campos del formulario</label>
                  <div className="space-y-2">
                    <Toggle label="📝 Nombre completo" checked={form.showName} onChange={(v) => updateField("showName", v)} />
                    <Toggle label="📧 Correo electrónico" checked={form.showEmail} onChange={(v) => updateField("showEmail", v)} />
                    <Toggle label="📱 WhatsApp" checked={form.showWhatsapp} onChange={(v) => updateField("showWhatsapp", v)} />
                    <Toggle label="💼 Ocupación (dropdown)" checked={form.showOccupation} onChange={(v) => updateField("showOccupation", v)} />
                  </div>
                </div>

                {/* Occupation Options */}
                {form.showOccupation && (
                  <div>
                    <label className="text-xs font-medium text-[var(--text-primary)] mb-2 block">Opciones de ocupación</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {form.occupationOptions.map((opt) => (
                        <span key={opt} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)]">
                          {opt}
                          <button type="button" onClick={() => removeOccupation(opt)} className="text-[var(--text-muted)] hover:text-red-500 ml-0.5"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input value={newOccupation} onChange={(e) => setNewOccupation(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOccupation(); } }}
                        placeholder="Nueva opción..." className="flex-1 px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]" />
                      <button type="button" onClick={addOccupation} className="px-3 py-2 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] text-sm font-medium hover:bg-[var(--accent)]/20 transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* WhatsApp Auto-Message */}
                <div className="border border-[var(--border)] rounded-xl overflow-hidden">
                  <button type="button" onClick={() => updateField("whatsappEnabled", !form.whatsappEnabled)}
                    className="w-full flex items-center justify-between p-4 bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${form.whatsappEnabled ? "bg-emerald-500/15" : "bg-[var(--bg-surface)]"}`}>
                        <MessageCircle className={`w-4 h-4 ${form.whatsappEnabled ? "text-emerald-500" : "text-[var(--text-muted)]"}`} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">Mensaje de WhatsApp automático</p>
                        <p className="text-[10px] text-[var(--text-muted)]">Envía un mensaje al lead vía Evolution API</p>
                      </div>
                    </div>
                    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.whatsappEnabled ? "bg-emerald-500" : "bg-[var(--border)]"}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${form.whatsappEnabled ? "translate-x-6" : "translate-x-1"}`} />
                    </div>
                  </button>
                  {form.whatsappEnabled && (
                    <div className="p-4 space-y-3 border-t border-[var(--border)]">
                      {/* Delay */}
                      <div>
                        <label className="text-xs font-medium text-[var(--text-primary)] mb-1 block">¿Cuándo enviar?</label>
                        <select value={form.whatsappDelay} onChange={(e) => updateField("whatsappDelay", Number(e.target.value))}
                          className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]">
                          <option value={0}>⚡ Enseguida</option>
                          <option value={300}>⏱️ 5 minutos después</option>
                          <option value={600}>⏱️ 10 minutos después</option>
                          <option value={900}>⏱️ 15 minutos después</option>
                        </select>
                      </div>
                      {/* Message */}
                      <div>
                        <label className="text-xs font-medium text-[var(--text-primary)] mb-1 block">Mensaje</label>
                        <textarea value={form.whatsappMessage} onChange={(e) => updateField("whatsappMessage", e.target.value)} rows={4}
                          placeholder={"¡Hola {{nombre}}! 👋 Gracias por descargar nuestro recurso. ¿Tienes alguna duda?"}
                          className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] resize-none" />
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="text-[10px] text-[var(--text-muted)] font-medium">Variables:</span>
                          {["{{nombre}}", "{{email}}", "{{whatsapp}}", "{{ocupacion}}", "{{recurso}}"].map((v) => (
                            <button key={v} type="button"
                              onClick={() => updateField("whatsappMessage", form.whatsappMessage + v)}
                              className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors">
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error */}
                {error && <p className="text-xs text-red-500 font-medium px-1">{error}</p>}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => { setShowForm(false); setEditingId(null); }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition-colors">
                    Cancelar
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-[var(--accent)]/20">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
