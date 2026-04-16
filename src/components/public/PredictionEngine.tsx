"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getScrollSpeed, getLeadScore } from "@/lib/behavior-tracker";
import { X, Sparkles, ArrowUp } from "lucide-react";

/**
 * Behavioral Prediction Engine
 * Observes visitor behavior in real-time and shows contextual CTAs:
 * 1. Fast scroll → "¿Buscas algo específico?"
 * 2. Product hover >3s → "Te interesó [producto]"
 * 3. Exit intent → Gentle nudge with value proposition
 * 4. Inactivity >30s → Subtle animation nudge
 * 
 * Rules:
 * - Max 1 CTA per session to avoid annoyance
 * - All CTAs are dismissible
 * - Uses glassmorphism, no invasive popups
 */

type PredictionCTA = {
  type: "fast_scroll" | "exit_intent" | "inactivity";
  message: string;
  subMessage?: string;
};

export function PredictionEngine({ aiFeatures }: { aiFeatures?: Record<string, unknown> }) {
  const texts = ((aiFeatures?.predictionEngine as Record<string, unknown>)?.texts || {}) as Record<string, string>;
  const [activeCTA, setActiveCTA] = useState<PredictionCTA | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const ctaShown = useRef(false);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollCheckInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const showCTA = useCallback((cta: PredictionCTA) => {
    if (ctaShown.current || dismissed) return;
    ctaShown.current = true;
    setActiveCTA(cta);

    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      setActiveCTA(null);
    }, 8000);
  }, [dismissed]);

  const dismissCTA = useCallback(() => {
    setActiveCTA(null);
    setDismissed(true);
    sessionStorage.setItem("lp_cta_dismissed", "1");
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Check if already dismissed this session
    if (sessionStorage.getItem("lp_cta_dismissed")) {
      setDismissed(true);
      return;
    }

    // Small delay before starting observations
    const startDelay = setTimeout(() => {
      // 1. Fast scroll detection
      scrollCheckInterval.current = setInterval(() => {
        const speed = getScrollSpeed();
        if (speed > 3000) { // Very fast scroll (>3000px/s)
          showCTA({
            type: "fast_scroll",
            message: texts.fastScrollTitle || "⚡ ¿Buscas algo específico?",
            subMessage: texts.fastScrollSubtitle || "Parece que estás buscando algo en particular. ¿Te puedo ayudar?",
          });
          if (scrollCheckInterval.current) clearInterval(scrollCheckInterval.current);
        }
      }, 500);

      // 2. Exit intent detection (desktop only — mouse leaves viewport top)
      const handleMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 5 && e.movementY < 0) {
          showCTA({
            type: "exit_intent",
            message: texts.exitIntentTitle || "👋 ¡Espera! No te vayas aún",
            subMessage: texts.exitIntentSubtitle || "Tenemos algo especial para ti. ¿Le das una oportunidad?",
          });
          document.removeEventListener("mouseleave", handleMouseLeave);
        }
      };
      document.addEventListener("mouseleave", handleMouseLeave);

      // 3. Inactivity detection (no scroll or clicks for 30s)
      const resetInactivity = () => {
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        inactivityTimer.current = setTimeout(() => {
          showCTA({
            type: "inactivity",
            message: texts.inactivityTitle || "👀 ¿Sigues ahí?",
            subMessage: texts.inactivitySubtitle || "No te pierdas lo que tenemos para ofrecerte",
          });
        }, 30_000);
      };

      window.addEventListener("scroll", resetInactivity, { passive: true });
      window.addEventListener("click", resetInactivity, { passive: true });
      window.addEventListener("touchstart", resetInactivity, { passive: true });
      resetInactivity();

      return () => {
        if (scrollCheckInterval.current) clearInterval(scrollCheckInterval.current);
        document.removeEventListener("mouseleave", handleMouseLeave);
        window.removeEventListener("scroll", resetInactivity);
        window.removeEventListener("click", resetInactivity);
        window.removeEventListener("touchstart", resetInactivity);
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      };
    }, 5000); // Wait 5 seconds before activating

    return () => clearTimeout(startDelay);
  }, [mounted, showCTA]);

  if (!mounted || dismissed || !activeCTA) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-sm"
      >
        <div
          className="relative rounded-[var(--radius-xl)] p-5 text-center overflow-hidden"
          style={{
            background: "var(--bg-surface)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--border)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3), 0 0 40px rgba(6, 182, 212, 0.1)",
          }}
        >
          {/* Glow effect */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at 50% 0%, var(--accent) 0%, transparent 60%)",
            }}
          />

          {/* Close button */}
          <button
            onClick={dismissCTA}
            className="absolute top-3 right-3 p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content */}
          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
              className="w-10 h-10 mx-auto mb-3 rounded-full flex items-center justify-center"
              style={{ background: "var(--accent)", opacity: 0.15 }}
            >
              <Sparkles className="w-5 h-5" style={{ color: "var(--accent)" }} />
            </motion.div>

            <p className="text-base font-semibold text-[var(--text-primary)] mb-1">
              {activeCTA.message}
            </p>
            {activeCTA.subMessage && (
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                {activeCTA.subMessage}
              </p>
            )}

            {/* Scroll up hint for fast_scroll */}
            {activeCTA.type === "fast_scroll" && (
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="mt-3 flex items-center justify-center gap-1 text-xs text-[var(--accent)]"
              >
                <ArrowUp className="w-3 h-3" /> Volver arriba
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
