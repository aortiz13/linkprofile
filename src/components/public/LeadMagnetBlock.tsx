"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Loader2, CheckCircle, Shield } from "lucide-react";

interface LeadMagnetBlockProps {
  profileId: string;
  title?: string;
  description?: string;
  buttonText?: string;
  resourceUrl?: string;
  magnetId?: string;
  privacyUrl?: string;
}

export function LeadMagnetBlock({
  profileId,
  title = "Descarga tu recurso gratis",
  description = "",
  buttonText = "Descargar ahora",
  resourceUrl = "",
  magnetId = "",
  privacyUrl = "",
}: LeadMagnetBlockProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!accepted) {
      setError("Debes aceptar la política de privacidad");
      return;
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
        // Open the resource in a new tab
        if (resourceUrl) {
          window.open(resourceUrl, "_blank", "noopener,noreferrer");
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

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-[var(--radius-lg)] p-6 text-center w-full"
      >
        <div className="w-14 h-14 bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-7 h-7 text-green-500" />
        </div>
        <h3 className="font-semibold text-lg text-[var(--text-primary)]">¡Listo!</h3>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Tu recurso se está descargando. Revisa tu correo para más información.
        </p>
        {resourceUrl && (
          <a
            href={resourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-[var(--accent)] text-white text-sm font-medium rounded-[var(--radius-md)] hover:opacity-90 transition-opacity"
          >
            <Gift className="w-4 h-4" /> Descargar de nuevo
          </a>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-[var(--radius-lg)] p-5 w-full overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--accent)]/15 flex items-center justify-center shrink-0">
          <Gift className="w-5 h-5 text-[var(--accent)]" />
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] leading-tight">{title}</h3>
          {description && (
            <p className="text-sm text-[var(--text-muted)] mt-1 leading-relaxed">{description}</p>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          name="name"
          placeholder="Tu nombre"
          required
          className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] px-4 py-3 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] transition-colors text-sm"
        />
        <input
          type="email"
          name="email"
          placeholder="Tu email"
          required
          className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] px-4 py-3 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] transition-colors text-sm"
        />
        <input
          type="tel"
          name="phone"
          placeholder="WhatsApp (con código de país)"
          required
          className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] px-4 py-3 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] transition-colors text-sm"
        />

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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--accent)] text-white font-semibold rounded-[var(--radius-md)] py-3 mt-1 hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-70 transition-all text-sm"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Gift className="w-4 h-4" /> {buttonText}
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-[var(--text-muted)]/60 mt-1">
          <Shield className="w-3 h-3" /> Tus datos están protegidos
        </div>
      </form>
    </motion.div>
  );
}
