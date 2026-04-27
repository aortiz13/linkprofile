"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  Loader2,
  CheckCircle,
  Shield,
  Sparkles,
  Download,
  ArrowRight,
  ChevronDown,
  User,
  Mail,
  Phone,
  Briefcase,
} from "lucide-react";

const COUNTRY_CODES = [
  { code: "+54", flag: "🇦🇷", name: "Argentina" },
  { code: "+52", flag: "🇲🇽", name: "México" },
  { code: "+56", flag: "🇨🇱", name: "Chile" },
  { code: "+57", flag: "🇨🇴", name: "Colombia" },
  { code: "+51", flag: "🇵🇪", name: "Perú" },
  { code: "+593", flag: "🇪🇨", name: "Ecuador" },
  { code: "+598", flag: "🇺🇾", name: "Uruguay" },
  { code: "+595", flag: "🇵🇾", name: "Paraguay" },
  { code: "+591", flag: "🇧🇴", name: "Bolivia" },
  { code: "+58", flag: "🇻🇪", name: "Venezuela" },
  { code: "+506", flag: "🇨🇷", name: "Costa Rica" },
  { code: "+507", flag: "🇵🇦", name: "Panamá" },
  { code: "+503", flag: "🇸🇻", name: "El Salvador" },
  { code: "+502", flag: "🇬🇹", name: "Guatemala" },
  { code: "+504", flag: "🇭🇳", name: "Honduras" },
  { code: "+505", flag: "🇳🇮", name: "Nicaragua" },
  { code: "+1", flag: "🇺🇸", name: "Estados Unidos" },
  { code: "+34", flag: "🇪🇸", name: "España" },
  { code: "+55", flag: "🇧🇷", name: "Brasil" },
  { code: "+44", flag: "🇬🇧", name: "Reino Unido" },
];

interface LeadMagnetFormProps {
  slug: string;
  title: string;
  description: string | null;
  buttonText: string;
  coverImage: string | null;
  showName: boolean;
  showEmail: boolean;
  showWhatsapp: boolean;
  showOccupation: boolean;
  occupationOptions: string[];
}

export function LeadMagnetForm({
  slug,
  title,
  description,
  buttonText,
  coverImage,
  showName,
  showEmail,
  showWhatsapp,
  showOccupation,
  occupationOptions,
}: LeadMagnetFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resourceUrl, setResourceUrl] = useState("");
  const [error, setError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [phoneCountryOpen, setPhoneCountryOpen] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [occupation, setOccupation] = useState("");
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => { setDropdownOpen(false); setPhoneCountryOpen(false); };
    if (dropdownOpen || phoneCountryOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [dropdownOpen, phoneCountryOpen]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setLoading(true);

      try {
        const res = await fetch("/api/lead-magnet/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, name, email, phone: `${countryCode.code}${phoneNumber}`, occupation }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setSuccess(true);
          setResourceUrl(data.resourceUrl || "");
          // Auto-redirect to resource
          if (data.resourceUrl) {
            const a = document.createElement("a");
            a.href = data.resourceUrl;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            document.body.appendChild(a);
            a.click();
            setTimeout(() => document.body.removeChild(a), 100);
          }
        } else {
          setError(data.error || "Error al enviar");
        }
      } catch {
        setError("Error de conexión");
      } finally {
        setLoading(false);
      }
    },
    [slug, name, email, countryCode, phoneNumber, occupation]
  );

  /* ── Success state ───────────────────────────────────────────────────── */
  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-[20px] overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.06) 100%)",
        }}
      >
        <div className="glass rounded-[20px] p-8 text-center border border-emerald-500/20">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12 }}
            className="w-20 h-20 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-5"
          >
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </motion.div>

          <h3 className="font-bold text-2xl text-[var(--text-primary)] mb-2">
            ¡Listo! 🎉
          </h3>
          <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed max-w-xs mx-auto">
            Tu recurso se está descargando. Si no se abrió automáticamente, haz clic abajo.
          </p>

          {resourceUrl && (
            <a
              href={resourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 px-8 py-3.5 bg-[var(--accent)] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-[var(--accent)]/25"
            >
              <Download className="w-4 h-4" />
              Descargar recurso
            </a>
          )}
        </div>
      </motion.div>
    );
  }

  /* ── Form ─────────────────────────────────────────────────────────────── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="rounded-[20px] overflow-visible"
    >
      {/* Cover image */}
      {coverImage && (
        <div className="relative w-full h-48 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImage}
            alt=""
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.65) 80%, rgba(0,0,0,0.9) 100%)",
            }}
          />
          {/* Floating sparkles */}
          <motion.div
            className="absolute top-4 right-4 text-white/60"
            animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.15, 0.95, 1] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            <Sparkles className="w-6 h-6" />
          </motion.div>

          {/* Badge */}
          <div className="absolute top-3 left-3">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white backdrop-blur-md"
              style={{ background: "rgba(6, 182, 212, 0.7)" }}
            >
              <Gift className="w-3.5 h-3.5" />
              GRATIS
            </motion.div>
          </div>

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 pb-4">
            <h1 className="font-bold text-xl text-white leading-tight drop-shadow-lg">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-white/80 mt-1.5 leading-relaxed drop-shadow">
                {description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Card body */}
      <div
        className="glass p-6 overflow-visible"
        style={{
          borderRadius: coverImage
            ? "0 0 20px 20px"
            : "20px",
        }}
      >
        {/* No-image header */}
        {!coverImage && (
          <div className="mb-6">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/15 flex items-center justify-center">
                  <Gift className="w-7 h-7 text-[var(--accent)]" />
                </div>
                <motion.div
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[var(--bg-surface)]"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">
                  Recurso gratuito
                </span>
                <h1 className="font-bold text-[var(--text-primary)] text-xl leading-tight mt-1">
                  {title}
                </h1>
                {description && (
                  <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Name */}
          {showName && (
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre completo"
                required
                className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-3.5 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all text-sm"
              />
            </div>
          )}

          {/* Email */}
          {showEmail && (
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Correo electrónico"
                required
                className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-3.5 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all text-sm"
              />
            </div>
          )}

          {/* WhatsApp */}
          {showWhatsapp && (
            <div className="flex gap-2">
              {/* Country code selector */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setPhoneCountryOpen(!phoneCountryOpen); }}
                  className={`flex items-center gap-1.5 bg-[var(--bg-surface)] border rounded-xl px-3 py-3.5 text-sm transition-all min-w-[100px] ${
                    phoneCountryOpen
                      ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/20"
                      : "border-[var(--border)] hover:border-[var(--border-hover)]"
                  }`}
                >
                  <span className="text-base leading-none">{countryCode.flag}</span>
                  <span className="text-[var(--text-primary)] font-medium">{countryCode.code}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform ${phoneCountryOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {phoneCountryOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-50 w-56 mt-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setCountryCode(c); setPhoneCountryOpen(false); }}
                          className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2.5 transition-colors ${
                            countryCode.code === c.code
                              ? "bg-[var(--accent)]/10 text-[var(--accent)] font-medium"
                              : "text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                          }`}
                        >
                          <span className="text-base leading-none">{c.flag}</span>
                          <span className="flex-1">{c.name}</span>
                          <span className="text-[var(--text-muted)] text-xs">{c.code}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Phone number */}
              <div className="relative flex-1">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9\s]/g, ""))}
                  placeholder="11 1234 5678"
                  required
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-3.5 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all text-sm"
                />
              </div>
            </div>
          )}

          {/* Occupation dropdown */}
          {showOccupation && (
            <div className="relative">
              <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] z-10" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownOpen(!dropdownOpen);
                }}
                className={`w-full bg-[var(--bg-surface)] border rounded-xl pl-10 pr-10 py-3.5 outline-none text-left text-sm transition-all ${
                  occupation
                    ? "text-[var(--text-primary)] border-[var(--border)]"
                    : "text-[var(--text-muted)] border-[var(--border)]"
                } ${
                  dropdownOpen
                    ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/20"
                    : "hover:border-[var(--border-hover)]"
                }`}
              >
                {occupation || "Selecciona tu ocupación"}
              </button>
              <ChevronDown
                className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] transition-transform ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-50 w-full mt-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden"
                  >
                    {occupationOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOccupation(opt);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          occupation === opt
                            ? "bg-[var(--accent)]/10 text-[var(--accent)] font-medium"
                            : "text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hidden input for form validation */}
              <input
                type="text"
                value={occupation}
                required
                onChange={() => {}}
                className="sr-only"
                tabIndex={-1}
              />
            </div>
          )}

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-red-500 font-medium px-1"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Privacy checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group mt-1">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={acceptPrivacy}
                onChange={(e) => setAcceptPrivacy(e.target.checked)}
                required
                className="sr-only peer"
              />
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                acceptPrivacy
                  ? "bg-[var(--accent)] border-[var(--accent)]"
                  : "border-[var(--border)] group-hover:border-[var(--accent)]/50"
              }`}>
                {acceptPrivacy && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-xs text-[var(--text-muted)] leading-relaxed">
              Acepto la{" "}
              <a
                href="/privacidad"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] underline hover:no-underline"
                onClick={(e) => e.stopPropagation()}
              >
                política de privacidad
              </a>{" "}
              y autorizo el uso de mis datos para recibir el recurso.
            </span>
          </label>

          {/* CTA Button */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative w-full font-semibold rounded-xl py-4 mt-1 flex items-center justify-center gap-2.5 disabled:opacity-70 transition-all text-sm overflow-hidden group"
            style={{
              background: "var(--accent)",
              color: "white",
              boxShadow: "0 4px 20px rgba(6, 182, 212, 0.35)",
            }}
          >
            {/* Shimmer */}
            <span
              className="absolute inset-0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-in-out"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
              }}
            />
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Gift className="w-4 h-4" />
                {buttonText}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </motion.button>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-[var(--text-muted)]/60 mt-1">
            <Shield className="w-3 h-3" />
            Tus datos están protegidos y seguros
          </div>
        </form>
      </div>
    </motion.div>
  );
}
