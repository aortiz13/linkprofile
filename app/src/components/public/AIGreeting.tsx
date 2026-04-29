"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useVisitorContext, getTimeGreeting, getCountryFlag, getReferrerLabel } from "@/lib/visitor-context";

interface AIGreetingProps {
  config: Record<string, unknown>;
  customTexts?: Record<string, string>;
}

const DEFAULT_WEATHER: Record<string, string> = {
  clear: "Hermoso día soleado por allá ☀️",
  clouds: "Un día nublado, perfecto para explorar 🌥️",
  rain: "Llueve por allá, ideal para quedarse navegando 🌧️",
  drizzle: "Una llovizna suave por tu zona 🌦️",
  snow: "¡Está nevando por tu ciudad! ❄️",
  thunderstorm: "Tormenta eléctrica... mejor quedarse adentro ⛈️",
  mist: "Día con neblina, misterioso 🌫️",
};

const DEFAULT_TIME_GREETINGS: Record<string, string> = {
  morning: "Buenos días",
  afternoon: "Buenas tardes",
  evening: "Buenas noches",
  night: "Buenas noches",
};

const DEFAULT_RETURNING = "¡Qué bueno verte de nuevo! 👋";

export function AIGreeting({ config, customTexts }: AIGreetingProps) {
  const visitor = useVisitorContext();
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [mounted, setMounted] = useState(false);

  const showCity = config.showCity !== false;
  const showReferrer = config.showReferrer !== false;
  const showWeather = config.showWeather !== false;
  const showReturning = config.showReturning !== false;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!visitor.ready || !mounted) return;

    // Build the personalized greeting
    const parts: string[] = [];

    // Time greeting + location (customizable)
    const greeting = customTexts?.[visitor.timeOfDay] || DEFAULT_TIME_GREETINGS[visitor.timeOfDay] || "Hola";
    const flag = getCountryFlag(visitor.country);

    if (showCity && visitor.city) {
      parts.push(`${greeting} desde ${visitor.city} ${flag}`);
    } else if (visitor.countryName) {
      parts.push(`${greeting} ${flag}`);
    } else {
      parts.push(`${greeting}`);
    }

    // Returning visitor (customizable)
    if (showReturning && visitor.isReturning && visitor.visitCount > 1) {
      parts.push(customTexts?.returning || DEFAULT_RETURNING);
    }

    // Referrer
    if (showReferrer) {
      const label = getReferrerLabel(visitor.referrerSource);
      if (label) {
        parts.push(`Llegaste desde ${label}`);
      }
    }

    // Weather (customizable)
    if (showWeather && visitor.weather.condition) {
      const weatherKey = "weather" + visitor.weather.condition.charAt(0).toUpperCase() + visitor.weather.condition.slice(1);
      const comment = customTexts?.[weatherKey] || DEFAULT_WEATHER[visitor.weather.condition];
      if (comment) {
        parts.push(comment);
      }
    }

    const fullText = parts.join(" — ");

    // Typewriter effect
    setIsTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayText(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 28); // ~35 chars per second

    return () => clearInterval(interval);
  }, [visitor.ready, mounted, showCity, showReferrer, showWeather, showReturning, visitor.city, visitor.country, visitor.countryName, visitor.timeOfDay, visitor.referrerSource, visitor.weather.condition, visitor.isReturning, visitor.visitCount]);

  if (!mounted || !visitor.ready) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass rounded-[var(--radius-lg)] px-5 py-4 mb-4 text-center relative overflow-hidden"
      >
        {/* Subtle AI glow effect */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, var(--accent) 0%, transparent 70%)",
          }}
        />

        <p className="text-sm text-[var(--text-muted)] relative z-10 leading-relaxed min-h-[1.5em]">
          {displayText}
          {isTyping && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="inline-block ml-0.5 w-[2px] h-[14px] bg-[var(--accent)] align-middle"
            />
          )}
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
