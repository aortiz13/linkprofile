"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Loader2, CheckCircle, Shield, Sparkles, Download, ArrowRight, X, AlertCircle } from "lucide-react";
import { useWhatsAppValidation } from "@/lib/useWhatsAppValidation";

interface LeadMagnetBlockProps {
  profileId: string;
  title?: string;
  description?: string;
  buttonText?: string;
  resourceUrl?: string;
  magnetId?: string;
  privacyUrl?: string;
  coverImage?: string;
  displayMode?: "block" | "popup";
}

export function LeadMagnetBlock({
  profileId,
  title = "Descarga tu recurso gratis",
  description = "",
  buttonText = "Descargar ahora",
  resourceUrl = "",
  magnetId = "",
  privacyUrl = "",
  coverImage = "",
  displayMode = "block",
}: LeadMagnetBlockProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [phoneValue, setPhoneValue] = useState("");

  // WhatsApp number validation
  const waValidation = useWhatsAppValidation();

  const storageKey = `lm_dismissed_${magnetId || "default"}`;

  const handleClosePopup = useCallback(() => {
    setPopupOpen(false);
    try { sessionStorage.setItem(storageKey, "1"); } catch {}
    document.body.style.overflow = "";
  }, [storageKey]);

  useEffect(() => {
    if (displayMode !== "popup") return;
    try {
      if (sessionStorage.getItem(storageKey)) return;
    } catch {}
    // Small delay for smoother entrance after page loads
    const timer = setTimeout(() => {
      setPopupOpen(true);
      document.body.style.overflow = "hidden";
    }, 800);
    return () => clearTimeout(timer);
  }, [displayMode, storageKey]);

  // Auto-close popup after successful submission
  useEffect(() => {
    if (success && displayMode === "popup") {
      const t = setTimeout(() => handleClosePopup(), 2500);
      return () => clearTimeout(t);
    }
  }, [success, displayMode, handleClosePopup]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!accepted) {
      setError("Debes aceptar la política de privacidad");
      return;
    }

    // Block submit if WhatsApp validation failed
    if (waValidation.isBlocked) {
      setError("Debe ser un número válido para poder continuar");
      return;
    }

    // If phone not yet validated, validate now
    if (phoneValue && waValidation.status === "idle") {
      const isValid = await waValidation.validate(phoneValue);
      if (!isValid) {
        setError("Debe ser un número válido para poder continuar");
        return;
      }
    }

    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      profileId,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      source: magnetId ? `lead_magnet:${magnetId}` : "lead_magnet",
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setSuccess(true);
        // Trigger download immediately — use a programmatic <a> click
        // instead of window.open() because in-app browsers (TikTok,
        // Instagram) block window.open as a popup.
        if (resourceUrl) {
          const a = document.createElement("a");
          a.href = resourceUrl;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          document.body.appendChild(a);
          a.click();
          // Clean up after a short delay
          setTimeout(() => document.body.removeChild(a), 100);
        }
      } else {
        const r = await res.json();
        setError(r.error || "Error al enviar");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  /* ── Success state ───────────────────────────────────────────────────── */
  const successContent = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-[var(--radius-lg)] overflow-hidden w-full"
      style={{
        background: "linear-gradient(135deg, rgba(var(--accent-rgb, 99,102,241), 0.12) 0%, rgba(var(--accent-rgb, 99,102,241), 0.04) 100%)",
      }}
    >
      <div className="glass rounded-[var(--radius-lg)] p-8 text-center w-full" style={{ borderColor: "rgba(6,182,212,0.2)" }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(34, 197, 94, 0.15)" }}
        >
          <CheckCircle className="w-8 h-8 text-green-500" />
        </motion.div>
        <h3 className="font-bold text-xl text-[var(--text-primary)]">¡Listo!</h3>
        <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed">
          Tu recurso se está descargando. Revisa tu correo para más información.
        </p>
        {resourceUrl && (
          <a
            href={resourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-5 px-6 py-3 bg-[var(--accent)] text-white text-sm font-semibold rounded-[var(--radius-md)] hover:opacity-90 transition-opacity shadow-lg"
          >
            <Download className="w-4 h-4" /> Descargar de nuevo
          </a>
        )}
      </div>
    </motion.div>
  );

  /* ── Main form ───────────────────────────────────────────────────────── */
  const formContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-[var(--radius-lg)] overflow-hidden w-full"
    >
      {/* ── Cover image hero ──────────────────────────────────────────── */}
      {coverImage && (
        <div className="relative w-full h-44 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImage}
            alt=""
            className="w-full h-full object-cover"
          />
          {/* Dark gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.65) 80%, rgba(0,0,0,0.85) 100%)",
            }}
          />
          {/* Floating sparkle particles (decorative) */}
          <motion.div
            className="absolute top-4 right-4 text-white/60"
            animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.15, 0.95, 1] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            <Sparkles className="w-6 h-6" />
          </motion.div>
          <motion.div
            className="absolute top-8 left-6 text-white/30"
            animate={{ rotate: [0, -12, 8, 0], y: [0, -4, 2, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
          >
            <Sparkles className="w-4 h-4" />
          </motion.div>

          {/* Badge on image */}
          <div className="absolute top-3 left-3">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white backdrop-blur-md"
              style={{ background: "rgba(var(--accent-rgb, 99,102,241), 0.7)" }}
            >
              <Gift className="w-3.5 h-3.5" />
              GRATIS
            </motion.div>
          </div>

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 pb-4">
            <h3 className="font-bold text-lg text-white leading-tight drop-shadow-lg">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-white/80 mt-1.5 leading-relaxed drop-shadow">
                {description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Card body ─────────────────────────────────────────────────── */}
      <div
        className="glass p-5 w-full"
        style={{
          borderRadius: coverImage
            ? "0 0 var(--radius-lg) var(--radius-lg)"
            : "var(--radius-lg)",
        }}
      >
        {/* No-image header (shown only when there's no cover image) */}
        {!coverImage && (
          <div className="mb-5">
            {/* Decorative accent bar + icon */}
            <div className="flex items-start gap-3.5">
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center" style={{ background: "rgba(6, 182, 212, 0.15)" }}>
                  <Gift className="w-6 h-6" style={{ color: "var(--accent)" }} />
                </div>
                {/* Pulsing dot */}
                <motion.div
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[var(--bg-surface)]"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">
                    Recurso gratuito
                  </span>
                </div>
                <h3 className="font-bold text-[var(--text-primary)] text-lg leading-tight">
                  {title}
                </h3>
                {description && (
                  <p className="text-sm text-[var(--text-muted)] mt-1.5 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            name="name"
            placeholder="Tu nombre"
            required
            className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] px-4 py-3 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] transition-all text-sm"
          />
          <input
            type="email"
            name="email"
            placeholder="Tu email"
            required
            className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] px-4 py-3 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] transition-all text-sm"
          />
          <div className="relative">
            <input
              type="tel"
              name="phone"
              value={phoneValue}
              onChange={(e) => {
                setPhoneValue(e.target.value);
                waValidation.reset();
              }}
              onBlur={() => {
                const clean = phoneValue.replace(/[^0-9]/g, "");
                if (clean.length >= 8) {
                  waValidation.validate(phoneValue);
                }
              }}
              placeholder="WhatsApp (con código de país)"
              required
              className="w-full bg-[var(--bg-surface)] rounded-[var(--radius-md)] px-4 pr-10 py-3 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all text-sm"
              style={{
                border: `1px solid ${waValidation.status === "valid" ? "#10b981" : waValidation.status === "invalid" ? "#ef4444" : "var(--border)"}`,
              }}
            />
            {/* Validation status indicator */}
            <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
              {waValidation.status === "checking" && (
                <Loader2 className="animate-spin" style={{ width: 16, height: 16, color: "var(--accent)" }} />
              )}
              {waValidation.status === "valid" && (
                <CheckCircle style={{ width: 16, height: 16, color: "#10b981" }} />
              )}
              {waValidation.status === "invalid" && (
                <AlertCircle style={{ width: 16, height: 16, color: "#ef4444" }} />
              )}
            </div>
          </div>
          {/* WhatsApp validation error */}
          <AnimatePresence>
            {waValidation.errorMessage && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-red-500 font-medium -mt-1"
              >
                {waValidation.errorMessage}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Privacy policy checkbox */}
          <label className="flex items-start gap-2 cursor-pointer select-none mt-1">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => { setAccepted(e.target.checked); setError(""); }}
              className="mt-0.5 w-4 h-4 rounded border-[var(--border)] accent-[var(--accent)]"
            />
            <span className="text-xs text-[var(--text-muted)] leading-relaxed">
              Acepto la{" "}
              {privacyUrl ? (
                <a
                  href={privacyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent)] underline hover:opacity-80"
                >
                  política de privacidad
                </a>
              ) : (
                "política de privacidad"
              )}{" "}
              y autorizo el uso de mis datos para recibir el recurso.
            </span>
          </label>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-red-500 font-medium"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* CTA Button with glow */}
          <motion.button
            type="submit"
            disabled={loading || waValidation.isBlocked || waValidation.status === "checking"}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative w-full font-semibold rounded-[var(--radius-md)] py-3.5 mt-1 flex items-center justify-center gap-2 disabled:opacity-70 transition-all text-sm overflow-hidden group"
            style={{
              background: "var(--accent)",
              color: "white",
              boxShadow: "0 4px 16px rgba(var(--accent-rgb, 99,102,241), 0.35)",
            }}
          >
            {/* Shimmer effect */}
            <span
              className="absolute inset-0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-in-out"
              style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
              }}
            />
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Gift className="w-4 h-4" /> {buttonText} <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </motion.button>

          <div className="flex items-center justify-center gap-1.5 text-[10px] mt-1" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
            <Shield style={{ width: 12, height: 12 }} /> Tus datos están protegidos
          </div>
        </form>
      </div>
    </motion.div>
  );

  const blockContent = success ? successContent : formContent;

  /* ── Block mode (default) ────────────────────────────────────────────── */
  if (displayMode !== "popup") {
    return blockContent;
  }

  /* ── Popup mode ──────────────────────────────────────────────────────── */
  return (
    <AnimatePresence>
      {popupOpen && (
        <motion.div
          key="lead-magnet-popup-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClosePopup();
          }}
        >
          <motion.div
            key="lead-magnet-popup-card"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full max-w-md"
          >
            {/* Close button */}
            <button
              onClick={handleClosePopup}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors shadow-lg"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>

            {blockContent}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

