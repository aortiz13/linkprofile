"use client";

import { useEffect, useRef } from "react";
import { useVisitorContext } from "@/lib/visitor-context";

type MoodPalette = {
  bgBase: string;
  bgSurface: string;
  bgElevated: string;
  textMuted: string;
  border: string;
  accent: string;
  accentLight: string;
  meshColor1: string;
  meshColor2: string;
};

const MOOD_PALETTES: Record<string, Record<string, MoodPalette>> = {
  // Time-based base palettes
  morning: {
    clear: {
      bgBase: "#0f172a", bgSurface: "rgba(30, 41, 59, 0.5)", bgElevated: "rgba(30, 41, 59, 0.8)",
      textMuted: "#94a3b8", border: "rgba(255,255,255,0.1)", accent: "#f59e0b", accentLight: "#fbbf24",
      meshColor1: "rgba(251, 191, 36, 0.15)", meshColor2: "rgba(245, 158, 11, 0.1)",
    },
    clouds: {
      bgBase: "#0f172a", bgSurface: "rgba(30, 41, 59, 0.5)", bgElevated: "rgba(30, 41, 59, 0.8)",
      textMuted: "#94a3b8", border: "rgba(255,255,255,0.1)", accent: "#64748b", accentLight: "#94a3b8",
      meshColor1: "rgba(148, 163, 184, 0.12)", meshColor2: "rgba(100, 116, 139, 0.08)",
    },
    rain: {
      bgBase: "#0a0e1a", bgSurface: "rgba(15, 23, 42, 0.6)", bgElevated: "rgba(15, 23, 42, 0.85)",
      textMuted: "#7c8db5", border: "rgba(255,255,255,0.07)", accent: "#3b82f6", accentLight: "#60a5fa",
      meshColor1: "rgba(59, 130, 246, 0.12)", meshColor2: "rgba(96, 165, 250, 0.08)",
    },
    default: {
      bgBase: "#0f172a", bgSurface: "rgba(30, 41, 59, 0.5)", bgElevated: "rgba(30, 41, 59, 0.8)",
      textMuted: "#94a3b8", border: "rgba(255,255,255,0.1)", accent: "#06b6d4", accentLight: "#22d3ee",
      meshColor1: "rgba(6, 182, 212, 0.12)", meshColor2: "rgba(34, 211, 238, 0.08)",
    },
  },
  afternoon: {
    clear: {
      bgBase: "#0f172a", bgSurface: "rgba(30, 41, 59, 0.5)", bgElevated: "rgba(30, 41, 59, 0.8)",
      textMuted: "#94a3b8", border: "rgba(255,255,255,0.1)", accent: "#f97316", accentLight: "#fb923c",
      meshColor1: "rgba(249, 115, 22, 0.15)", meshColor2: "rgba(251, 146, 60, 0.1)",
    },
    clouds: {
      bgBase: "#0f172a", bgSurface: "rgba(30, 41, 59, 0.5)", bgElevated: "rgba(30, 41, 59, 0.8)",
      textMuted: "#94a3b8", border: "rgba(255,255,255,0.1)", accent: "#8b95a5", accentLight: "#a0aec0",
      meshColor1: "rgba(160, 174, 192, 0.1)", meshColor2: "rgba(139, 149, 165, 0.06)",
    },
    rain: {
      bgBase: "#070b14", bgSurface: "rgba(10, 15, 30, 0.6)", bgElevated: "rgba(10, 15, 30, 0.85)",
      textMuted: "#6b7fa3", border: "rgba(255,255,255,0.06)", accent: "#2563eb", accentLight: "#3b82f6",
      meshColor1: "rgba(37, 99, 235, 0.15)", meshColor2: "rgba(59, 130, 246, 0.1)",
    },
    default: {
      bgBase: "#0f172a", bgSurface: "rgba(30, 41, 59, 0.5)", bgElevated: "rgba(30, 41, 59, 0.8)",
      textMuted: "#94a3b8", border: "rgba(255,255,255,0.1)", accent: "#06b6d4", accentLight: "#22d3ee",
      meshColor1: "rgba(6, 182, 212, 0.12)", meshColor2: "rgba(34, 211, 238, 0.08)",
    },
  },
  evening: {
    clear: {
      bgBase: "#0c0a1a", bgSurface: "rgba(20, 15, 40, 0.55)", bgElevated: "rgba(20, 15, 40, 0.8)",
      textMuted: "#8b7fb8", border: "rgba(255,255,255,0.08)", accent: "#a855f7", accentLight: "#c084fc",
      meshColor1: "rgba(168, 85, 247, 0.15)", meshColor2: "rgba(192, 132, 252, 0.1)",
    },
    rain: {
      bgBase: "#060810", bgSurface: "rgba(8, 12, 24, 0.6)", bgElevated: "rgba(8, 12, 24, 0.85)",
      textMuted: "#5a6a8a", border: "rgba(255,255,255,0.05)", accent: "#6366f1", accentLight: "#818cf8",
      meshColor1: "rgba(99, 102, 241, 0.12)", meshColor2: "rgba(129, 140, 248, 0.08)",
    },
    default: {
      bgBase: "#0c0a1a", bgSurface: "rgba(20, 15, 40, 0.55)", bgElevated: "rgba(20, 15, 40, 0.8)",
      textMuted: "#8b7fb8", border: "rgba(255,255,255,0.08)", accent: "#8b5cf6", accentLight: "#a78bfa",
      meshColor1: "rgba(139, 92, 246, 0.12)", meshColor2: "rgba(167, 139, 250, 0.08)",
    },
  },
  night: {
    clear: {
      bgBase: "#050510", bgSurface: "rgba(10, 10, 25, 0.55)", bgElevated: "rgba(10, 10, 25, 0.8)",
      textMuted: "#6b6b9e", border: "rgba(255,255,255,0.06)", accent: "#6366f1", accentLight: "#818cf8",
      meshColor1: "rgba(99, 102, 241, 0.1)", meshColor2: "rgba(129, 140, 248, 0.06)",
    },
    snow: {
      bgBase: "#0a0f1c", bgSurface: "rgba(15, 20, 35, 0.5)", bgElevated: "rgba(15, 20, 35, 0.8)",
      textMuted: "#8899bb", border: "rgba(255,255,255,0.1)", accent: "#e2e8f0", accentLight: "#f1f5f9",
      meshColor1: "rgba(226, 232, 240, 0.1)", meshColor2: "rgba(241, 245, 249, 0.06)",
    },
    default: {
      bgBase: "#050510", bgSurface: "rgba(10, 10, 25, 0.55)", bgElevated: "rgba(10, 10, 25, 0.8)",
      textMuted: "#6b6b9e", border: "rgba(255,255,255,0.06)", accent: "#06b6d4", accentLight: "#22d3ee",
      meshColor1: "rgba(6, 182, 212, 0.08)", meshColor2: "rgba(34, 211, 238, 0.05)",
    },
  },
};

function getMoodPalette(timeOfDay: string, weather: string | null): MoodPalette {
  const timePalettes = MOOD_PALETTES[timeOfDay] || MOOD_PALETTES.afternoon;
  const w = weather || "default";
  return timePalettes[w] || timePalettes.default;
}

export function MoodThemeProvider() {
  const visitor = useVisitorContext();
  const applied = useRef(false);

  useEffect(() => {
    if (!visitor.ready || applied.current) return;
    applied.current = true;

    const palette = getMoodPalette(visitor.timeOfDay, visitor.weather.condition);
    const root = document.documentElement;

    // Apply CSS custom properties with smooth transition
    root.style.setProperty("transition", "background-color 2s ease, color 1s ease");

    // Only override if the page is using a theme that supports dynamic mood
    const currentTheme = document.querySelector("[data-theme]")?.getAttribute("data-theme");
    if (currentTheme === "light" || currentTheme === "minimal") {
      // Don't override light themes — mood theme works best on dark/glass
      return;
    }

    root.style.setProperty("--bg-base", palette.bgBase);
    root.style.setProperty("--bg-surface", palette.bgSurface);
    root.style.setProperty("--bg-elevated", palette.bgElevated);
    root.style.setProperty("--text-muted", palette.textMuted);
    root.style.setProperty("--border", palette.border);
    root.style.setProperty("--accent", palette.accent);
    root.style.setProperty("--accent-light", palette.accentLight);
    root.style.setProperty("--accent-glow", palette.accent.replace(")", ", 0.5)").replace("rgb", "rgba"));

    // Custom properties for animated background meshes
    root.style.setProperty("--mood-mesh-1", palette.meshColor1);
    root.style.setProperty("--mood-mesh-2", palette.meshColor2);
  }, [visitor.ready, visitor.timeOfDay, visitor.weather.condition]);

  return null; // Invisible component
}
