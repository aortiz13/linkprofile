"use client";

import { motion } from "framer-motion";

interface SocialIcon {
  platform: string;
  url: string;
  title?: string;
  subtitle?: string;
}

const PLATFORM_LOGOS: Record<string, { color: string; label: string }> = {
  instagram: { color: "#E4405F", label: "Instagram" },
  tiktok: { color: "#000000", label: "TikTok" },
  youtube: { color: "#FF0000", label: "YouTube" },
  twitter: { color: "#1DA1F2", label: "Twitter" },
  linkedin: { color: "#0A66C2", label: "LinkedIn" },
  facebook: { color: "#1877F2", label: "Facebook" },
  whatsapp: { color: "#25D366", label: "WhatsApp" },
};

interface SocialIconsBlockProps {
  icons: SocialIcon[];
  layout?: "row" | "list";
  onTrackClick?: (url: string, title: string) => void;
}

export function SocialIconsBlock({ icons, layout = "row", onTrackClick }: SocialIconsBlockProps) {
  if (!icons || icons.length === 0) return null;

  if (layout === "list") {
    return (
      <div className="flex flex-col gap-3 w-full py-2">
        {icons.map((icon, idx) => {
          const platform = PLATFORM_LOGOS[icon.platform] || { color: "#6b7280", label: icon.platform };
          
          return (
            <motion.a
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={(e) => {
                if (onTrackClick) {
                  onTrackClick(icon.url, icon.title || platform.label);
                }
              }}
              href={icon.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 w-full p-3 rounded-[var(--radius-xl)]"
              style={{ 
                backgroundColor: platform.color + "0d",
                border: `1px solid ${platform.color}20` 
              }}
            >
              <div 
                className="w-12 h-12 flex-shrink-0 rounded-[var(--radius-lg)] flex items-center justify-center transition-transform hover:scale-105"
                style={{ backgroundColor: platform.color + "15" }}
              >
                <div 
                  className="w-5 h-5 flex-shrink-0"
                  style={{
                    backgroundColor: platform.color,
                    WebkitMaskImage: `url(https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/${icon.platform === 'twitter' ? 'x' : icon.platform}.svg)`,
                    WebkitMaskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskImage: `url(https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/${icon.platform === 'twitter' ? 'x' : icon.platform}.svg)`,
                    maskSize: "contain",
                    maskRepeat: "no-repeat",
                    maskPosition: "center",
                  }}
                />
              </div>
              <div className="flex flex-col flex-1 truncate">
                <span className="text-sm font-semibold truncate text-[var(--text-primary)]">
                  {icon.title || platform.label}
                </span>
                {icon.subtitle && (
                  <span className="text-xs truncate text-[var(--text-muted)]">
                    {icon.subtitle}
                  </span>
                )}
              </div>
            </motion.a>
          );
        })}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-3 w-full py-2"
    >
      {icons.map((icon, idx) => {
        const platform = PLATFORM_LOGOS[icon.platform] || { color: "#6b7280", label: icon.platform };
        return (
          <a
            key={idx}
            href={icon.url}
            onClick={(e) => {
              if (onTrackClick) {
                onTrackClick(icon.url, platform.label);
              }
            }}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-transform hover:scale-110"
            style={{ backgroundColor: platform.color + "15" }}
            title={platform.label}
          >
            <div 
              className="w-4 h-4 flex-shrink-0"
              style={{
                backgroundColor: platform.color,
                WebkitMaskImage: `url(https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/${icon.platform === 'twitter' ? 'x' : icon.platform}.svg)`,
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskImage: `url(https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/${icon.platform === 'twitter' ? 'x' : icon.platform}.svg)`,
                maskSize: "contain",
                maskRepeat: "no-repeat",
                maskPosition: "center",
              }}
            />
          </a>
        );
      })}
    </motion.div>
  );
}
