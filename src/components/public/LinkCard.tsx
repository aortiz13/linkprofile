"use client";

import { motion } from "framer-motion";
import {
  Camera,
  Music,
  MessageCircle,
  Video,
  Globe,
  Mail,
  Bot,
  AtSign,
  ArrowRight,
  Camera as CameraUser,
  Video as VideoIcon,
  Home,
  User as UserIcon,
  Edit as EditIcon,
  type LucideIcon,
} from "lucide-react";
import type { Link } from "@/lib/db/schema";
import { openWithDeepLink, getFallbackUrl } from "@/lib/deep-links";

// Map link types/icons to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  instagram: Camera,
  music: Music,
  "message-circle": MessageCircle,
  youtube: VideoIcon,
  globe: Globe,
  mail: Mail,
  bot: Bot,
  twitter: AtSign,
  home: Home,
  video: VideoIcon,
  clipboard: EditIcon,
  vcard: UserIcon,
};

// Color accents per platform
const TYPE_COLORS: Record<string, string> = {
  instagram: "from-pink-500/20 to-purple-500/20",
  tiktok: "from-cyan-400/20 to-pink-500/20",
  whatsapp: "from-green-500/20 to-emerald-400/20",
  youtube: "from-red-500/20 to-orange-500/20",
  email: "from-blue-400/20 to-cyan-400/20",
  twitter: "from-sky-400/20 to-blue-500/20",
  ai_ref: "from-violet-500/20 to-fuchsia-500/20",
  custom: "from-gray-500/10 to-gray-400/10",
  property: "from-orange-500/20 to-amber-500/20",
  vcard: "from-blue-500/20 to-indigo-500/20",
  embed: "from-black/20 to-gray-800/20",
};

const TYPE_ICON_BG: Record<string, string> = {
  instagram: "bg-gradient-to-br from-pink-500 to-purple-600",
  tiktok: "bg-gradient-to-br from-cyan-400 to-pink-500",
  whatsapp: "bg-gradient-to-br from-green-500 to-emerald-500",
  youtube: "bg-gradient-to-br from-red-500 to-red-600",
  email: "bg-gradient-to-br from-blue-500 to-cyan-500",
  twitter: "bg-gradient-to-br from-sky-400 to-blue-500",
  ai_ref: "bg-gradient-to-br from-violet-500 to-fuchsia-500",
  custom: "bg-gradient-to-br from-gray-500 to-gray-600",
  property: "bg-gradient-to-br from-orange-500 to-amber-600",
  vcard: "bg-gradient-to-br from-blue-500 to-indigo-600",
  embed: "bg-gradient-to-br from-gray-800 to-black",
};

interface LinkCardProps {
  link: Link;
  index: number;
  isBento?: boolean;
}

export function LinkCard({ link, index, isBento = false }: LinkCardProps) {
  const IconComponent = ICON_MAP[link.icon || "globe"] || Globe;
  const iconBg = TYPE_ICON_BG[link.type] || TYPE_ICON_BG.custom;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    // Fire-and-forget tracking
    try {
      const sessionId = getOrCreateSessionId();
      fetch("/api/track/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId: link.id, sessionId }),
      }).catch(() => {}); // Silently fail
    } catch {
      // Never block navigation
    }

    // Deep link logic for social platforms
    const metadata = link.metadata as { handle?: string } | null;
    if (metadata?.handle && link.type !== "custom" && link.type !== "email" && link.type !== "ai_ref") {
      openWithDeepLink(link.type, metadata.handle, link.url);
    } else {
      window.open(link.url, "_blank", "noopener,noreferrer");
    }
  };

  // Render embed if type is embed
  if (link.type === "embed") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 + index * 0.06, duration: 0.4 }}
        className={`w-full overflow-hidden rounded-[var(--radius-lg)] shadow-lg shadow-black/10 ${isBento ? "col-span-2" : ""}`}
      >
        <div className="relative w-full aspect-video bg-black/10">
          <iframe
            src={getEmbedUrl(link.url)}
            title={link.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full border-0"
          />
        </div>
      </motion.div>
    );
  }

  // Define Bento specific styles depending on the platform/type
  // For Bento, we might want YouTube or specific elements to span 2 cols
  const spanFull = isBento && (link.type === "property" || link.type === "youtube");
  const bentoClasses = isBento ? `flex-col justify-center items-center text-center p-6 gap-3 ${spanFull ? "col-span-2 flex-row text-left" : "col-span-1"}` : "flex-row p-4 gap-4";

  return (
    <motion.a
      href={link.url}
      onClick={handleClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.4 + index * 0.06,
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`link-card glass glass-hover rounded-[var(--radius-lg)] flex cursor-pointer group bg-gradient-to-br ${TYPE_COLORS[link.type] || TYPE_COLORS.custom} ${bentoClasses}`}
      rel="noopener noreferrer"
    >
      {/* Icon */}
      <div
        className={`${iconBg} ${isBento && !spanFull ? "w-14 h-14" : "w-10 h-10"} rounded-[var(--radius-md)] flex items-center justify-center shrink-0`}
      >
        <IconComponent className={`${isBento && !spanFull ? "w-7 h-7" : "w-5 h-5"} text-white`} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <p className={`font-medium text-[var(--text-primary)] truncate ${isBento && !spanFull ? "text-sm" : "text-sm"}`}>{link.title}</p>
        {(isBento && !spanFull && link.type === 'vcard') && <p className="text-xs text-[var(--text-muted)] mt-1">Guardar</p>}
      </div>

      {/* Arrow */}
      {(!isBento || spanFull) && (
        <ArrowRight className="link-arrow w-4 h-4 text-[var(--text-muted)] shrink-0" />
      )}
    </motion.a>
  );
}

// Convert common URLs to their embed equivalents
function getEmbedUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes("youtube.com") || urlObj.hostname.includes("youtu.be")) {
      const videoId = urlObj.searchParams.get("v") || urlObj.pathname.split("/").pop();
      return `https://www.youtube.com/embed/${videoId}`;
    }
    // Return Original if not recognized
    return url;
  } catch (e) {
    return url;
  }
}

// Session ID management
function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";

  const key = "lp_session_id";
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
}

export { getOrCreateSessionId };
