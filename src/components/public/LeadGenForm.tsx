"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useWhatsAppValidation } from "@/lib/useWhatsAppValidation";

interface LeadGenFormProps {
  profileId: string;
  title?: string;
}

export function LeadGenForm({ profileId, title = "Contáctame" }: LeadGenFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [phoneValue, setPhoneValue] = useState("");

  // WhatsApp number validation
  const waValidation = useWhatsAppValidation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

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

    const formData = new FormData(e.currentTarget);
    const data = {
      profileId,
      name: formData.get("name"),
      email: formData.get("email"),
      phone: phoneValue,
      message: formData.get("message"),
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        setError("Error al enviar el mensaje");
      }
    } catch (err) {
      console.error("Error submitting lead:", err);
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="glass rounded-[var(--radius-lg)] p-6 text-center text-[var(--text-primary)] mb-6">
        <div className="w-12 h-12 bg-[var(--text-primary)] opacity-20 rounded-full flex items-center justify-center mx-auto mb-3 absolute mix-blend-overlay"></div>
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 relative">
          <Send className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-lg">¡Mensaje Enviado!</h3>
        <p className="text-sm text-[var(--text-muted)]">Me pondré en contacto contigo pronto.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-[var(--radius-lg)] p-5 mb-6 w-full"
    >
      <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        {title || "Me interesa, quiero más información"}
      </h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          name="name"
          placeholder="Tu Nombre"
          required
          className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] px-4 py-3 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-hover)] transition-colors"
        />
        <div className="flex gap-3">
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-1/2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] px-4 py-3 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-hover)] transition-colors"
          />
          <div className="relative w-1/2">
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
              placeholder="Teléfono"
              required
              className="w-full bg-[var(--bg-surface)] rounded-[var(--radius-md)] px-4 pr-9 py-3 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors"
              style={{
                border: `1px solid ${waValidation.status === "valid" ? "#10b981" : waValidation.status === "invalid" ? "#ef4444" : "var(--border)"}`,
              }}
            />
            {/* Validation status indicator */}
            <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
              {waValidation.status === "checking" && (
                <Loader2 className="animate-spin" style={{ width: 14, height: 14, color: "var(--text-muted)" }} />
              )}
              {waValidation.status === "valid" && (
                <CheckCircle style={{ width: 14, height: 14, color: "#10b981" }} />
              )}
              {waValidation.status === "invalid" && (
                <AlertCircle style={{ width: 14, height: 14, color: "#ef4444" }} />
              )}
            </div>
          </div>
        </div>

        {/* WhatsApp validation error */}
        <AnimatePresence>
          {(waValidation.errorMessage || error) && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-red-500 font-medium -mt-1"
            >
              {waValidation.errorMessage || error}
            </motion.p>
          )}
        </AnimatePresence>

        <textarea
          name="message"
          placeholder="Mensaje (Opcional)"
          rows={2}
          className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] px-4 py-3 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-hover)] transition-colors resize-none"
        />
        <button
          type="submit"
          disabled={loading || waValidation.isBlocked || waValidation.status === "checking"}
          className="w-full bg-[var(--text-primary)] text-[var(--bg-base)] font-semibold rounded-[var(--radius-md)] py-3 mt-1 hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-70 transition-colors"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" /> Enviar Mensaje
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
