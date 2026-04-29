"use client";

import { motion } from "framer-motion";

interface VideoEmbedProps {
  url: string;
  provider?: string;
}

function getEmbedUrl(url: string, provider?: string): string | null {
  try {
    if (provider === "youtube" || url.includes("youtube.com") || url.includes("youtu.be")) {
      let videoId = "";
      if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
      } else {
        const u = new URL(url);
        videoId = u.searchParams.get("v") || "";
      }
      if (!videoId) return null;
      return `https://www.youtube-nocookie.com/embed/${videoId}`;
    }
    if (provider === "vimeo" || url.includes("vimeo.com")) {
      const match = url.match(/vimeo\.com\/(\d+)/);
      if (!match) return null;
      return `https://player.vimeo.com/video/${match[1]}`;
    }
    if (provider === "tiktok" || url.includes("tiktok.com")) {
      // TikTok embed uses their oEmbed; fallback to link
      return null;
    }
    return null;
  } catch {
    return null;
  }
}

export function VideoEmbed({ url, provider }: VideoEmbedProps) {
  if (!url) return null;

  const embedUrl = getEmbedUrl(url, provider);

  if (!embedUrl) {
    return (
      <motion.a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-[var(--radius-lg)] p-5 w-full block text-center text-sm text-[var(--accent)] hover:underline"
      >
        🎥 Ver video →
      </motion.a>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-[var(--radius-lg)] overflow-hidden w-full"
    >
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </motion.div>
  );
}
