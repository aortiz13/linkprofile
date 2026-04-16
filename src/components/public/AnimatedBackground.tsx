"use client";

import { useEffect, useState } from "react";

interface AnimatedBackgroundProps {
  theme?: string;
}

/**
 * Animated background that reacts to MoodThemeProvider CSS variables.
 * The gradient colors shift based on time-of-day and weather conditions.
 */
export function AnimatedBackground({ theme }: AnimatedBackgroundProps) {
  const [moodColors, setMoodColors] = useState({ accent: "", glow: "" });

  useEffect(() => {
    // Poll for mood CSS variable changes (set by MoodThemeProvider)
    const interval = setInterval(() => {
      const root = document.documentElement;
      const accent = getComputedStyle(root).getPropertyValue("--mood-accent").trim();
      const glow = getComputedStyle(root).getPropertyValue("--mood-glow").trim();
      if (accent && glow) {
        setMoodColors((prev) => {
          if (prev.accent !== accent || prev.glow !== glow) {
            return { accent, glow };
          }
          return prev;
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Hide meshes on minimal
  if (theme === "minimal") return null;

  const hasMood = moodColors.accent && moodColors.glow;

  return (
    <div
      className={`fixed inset-0 z-0 pointer-events-none transition-opacity duration-1000 ${
        theme === "light" ? "opacity-50" : "opacity-100"
      }`}
    >
      <div className="gradient-mesh" aria-hidden="true" />
      <div className="gradient-mesh-extra" aria-hidden="true" />

      {/* Mood-reactive overlay — subtle color wash from MoodThemeProvider */}
      {hasMood && (
        <div
          className="absolute inset-0 transition-all duration-[3000ms] ease-in-out"
          style={{
            background: `radial-gradient(ellipse at 30% 20%, ${moodColors.accent}08 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, ${moodColors.glow}06 0%, transparent 50%)`,
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

