"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Link2, Type, Video, Minus, AtSign, Search, Sparkles, Calendar } from "lucide-react";
import { useState } from "react";

const BLOCK_TYPES = [
  {
    type: "links",
    label: "Links",
    description: "Agrega botones con enlaces a tus redes, sitios web o contenido.",
    icon: Link2,
    color: "#06b6d4",
    category: "content",
  },
  {
    type: "text",
    label: "Texto",
    description: "Bloque de texto libre para descripciones, información o mensajes.",
    icon: Type,
    color: "#f59e0b",
    category: "content",
  },
  {
    type: "video",
    label: "Video",
    description: "Embebe un video de YouTube, TikTok o Vimeo.",
    icon: Video,
    color: "#ef4444",
    category: "content",
  },
  {
    type: "contact_form",
    label: "Formulario",
    description: "Formulario de contacto para captar leads y prospectos.",
    icon: AtSign,
    color: "#8b5cf6",
    category: "grow",
  },
  {
    type: "social_icons",
    label: "Redes sociales",
    description: "Íconos enlazados a tus perfiles de redes sociales.",
    icon: AtSign,
    color: "#ec4899",
    category: "grow",
  },
  {
    type: "divider",
    label: "Separador",
    description: "Divisor visual para organizar secciones.",
    icon: Minus,
    color: "#6b7280",
    category: "layout",
  },
  {
    type: "products",
    label: "Productos Asignados",
    description: "Muestra productos digitales con enlace de afiliado y vista previa.",
    icon: Search,
    color: "#10b981",
    category: "monetize",
  },
  {
    type: "geo_custom",
    label: "Mensaje por País",
    description: "Muestra un mensaje distinto o personalizado según el país del visitante.",
    icon: Type,
    color: "#3b82f6",
    category: "content",
  },
  {
    type: "ai_greeting",
    label: "Saludo AI",
    description: "Saludo hiper-personalizado con país, hora, clima y referrer del visitante.",
    icon: Sparkles,
    color: "#8b5cf6",
    category: "ai",
  },
  {
    type: "cal_com",
    label: "Agenda Cal.com",
    description: "Inserta tu calendario interactivo de Cal.com usando el código nativo.",
    icon: Calendar,
    color: "#1d4ed8",
    category: "grow",
  },
];

const CATEGORIES = [
  { key: "all", label: "Todos" },
  { key: "content", label: "Contenido" },
  { key: "monetize", label: "Monetizar" },
  { key: "grow", label: "Crecimiento" },
  { key: "layout", label: "Layout" },
  { key: "ai", label: "AI ✨" },
];

interface AddBlockModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (type: string) => void;
}

export function AddBlockModal({ open, onClose, onAdd }: AddBlockModalProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = BLOCK_TYPES.filter((bt) => {
    const matchesCategory = activeCategory === "all" || bt.category === activeCategory;
    const matchesSearch = !search || bt.label.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-xl)] w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
              <h2 className="text-lg font-bold">Agregar un bloque</h2>
              <button
                onClick={onClose}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left sidebar — categories */}
              <div className="w-44 border-r border-[var(--border)] p-3 space-y-1 shrink-0">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`w-full text-left px-3 py-2 rounded-[var(--radius-md)] text-sm transition-all ${
                      activeCategory === cat.key
                        ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Right content — block types */}
              <div className="flex-1 p-4 overflow-y-auto">
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar bloques..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>

                {/* Quick add row */}
                <div className="flex gap-3 mb-5">
                  {BLOCK_TYPES.slice(0, 4).map((bt) => (
                    <button
                      key={bt.type}
                      onClick={() => { onAdd(bt.type); onClose(); }}
                      className="flex flex-col items-center gap-1.5 group"
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{ backgroundColor: bt.color + "20" }}
                      >
                        <bt.icon className="w-5 h-5" style={{ color: bt.color }} />
                      </div>
                      <span className="text-xs text-[var(--text-muted)]">{bt.label}</span>
                    </button>
                  ))}
                </div>

                {/* Full list */}
                <div className="space-y-2">
                  {filtered.map((bt) => (
                    <button
                      key={bt.type}
                      onClick={() => { onAdd(bt.type); onClose(); }}
                      className="w-full flex items-center gap-4 p-3 rounded-[var(--radius-lg)] border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--bg-elevated)] transition-all group text-left"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: bt.color + "15" }}
                      >
                        <bt.icon className="w-5 h-5" style={{ color: bt.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{bt.label}</p>
                        <p className="text-xs text-[var(--text-muted)] line-clamp-1">
                          {bt.description}
                        </p>
                      </div>
                      <span className="text-xs text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity font-medium shrink-0">
                        AGREGAR
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
