"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LinkCard } from "./LinkCard";
import { LeadGenForm } from "./LeadGenForm";
import { ExternalLink, ArrowRight } from "lucide-react";
import type { Link, Profile } from "@/lib/db/schema";

interface LinkGridProps {
  profile: Profile;
  links: Link[];
}

export function LinkGrid({ profile, links }: LinkGridProps) {
  const layout = profile.layout || "list";

  return (
    <div className="w-full flex flex-col gap-6">
      {profile.leadgenEnabled && (
        <LeadGenForm profileId={profile.id} title={profile.leadgenTitle || undefined} />
      )}

      {links.length > 0 && (
        <>
          {/* List Layout (default) */}
          {layout === "list" && (
            <div className="flex flex-col gap-3">
              <AnimatePresence mode="popLayout">
                {links.map((link, index) => (
                  <LinkCard key={link.id} link={link} index={index} isBento={false} profileId={profile.id} />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Bento Grid Layout */}
          {layout === "bento" && (
            <div className="grid grid-cols-2 gap-3">
              <AnimatePresence mode="popLayout">
                {links.map((link, index) => (
                  <LinkCard key={link.id} link={link} index={index} isBento={true} profileId={profile.id} />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Grid Layout (2 columns with images) */}
          {layout === "grid" && (
            <div className="grid grid-cols-2 gap-3">
              {links.map((link, i) => (
                <LinkImageCard key={link.id} link={link} index={i} className="flex-col" profileId={profile.id} />
              ))}
            </div>
          )}

          {/* Large Card Layout */}
          {layout === "large_card" && (
            <div className="flex flex-col gap-4">
              {links.map((link, i) => (
                <LinkImageCard key={link.id} link={link} index={i} className="flex-col" sizes="(max-width: 768px) 100vw, 400px" profileId={profile.id} />
              ))}
            </div>
          )}

          {/* Carousel Layout */}
          {layout === "carousel" && (
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-2 -mx-4 px-4">
              {links.map((link, i) => (
                <div key={link.id} className="min-w-[70%] max-w-[280px] shrink-0 snap-center">
                  <LinkImageCard link={link} index={i} className="flex-col h-full" profileId={profile.id} />
                </div>
              ))}
            </div>
          )}

          {/* Alternating Layout */}
          {layout === "alternating" && (
            <div className="flex flex-col gap-3">
              {links.map((link, i) => (
                <LinkImageCard
                  key={link.id}
                  link={link}
                  index={i}
                  className={i % 2 === 0 ? "flex-row" : "flex-row-reverse"}
                  imgClassName="w-1/3 aspect-square"
                  profileId={profile.id}
                />
              ))}
            </div>
          )}

          {/* Text Left Layout */}
          {layout === "text_left" && (
            <div className="flex flex-col gap-3">
              {links.map((link, i) => (
                <LinkImageCard
                  key={link.id}
                  link={link}
                  index={i}
                  className="flex-row-reverse"
                  imgClassName="w-1/3 aspect-[4/3]"
                  profileId={profile.id}
                />
              ))}
            </div>
          )}

          {/* Text Right Layout */}
          {layout === "text_right" && (
            <div className="flex flex-col gap-3">
              {links.map((link, i) => (
                <LinkImageCard
                  key={link.id}
                  link={link}
                  index={i}
                  className="flex-row"
                  imgClassName="w-1/3 aspect-[4/3]"
                  profileId={profile.id}
                />
              ))}
            </div>
          )}

          {/* Story Layout */}
          {layout === "story" && (
            <div className="flex flex-col gap-4">
              {links.map((link, i) => (
                <LinkStoryCard key={link.id} link={link} index={i} profileId={profile.id} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Link Image Card (for image-rich layouts) ────────────────────────────────
interface LinkImageCardProps {
  link: Link;
  index: number;
  className?: string;
  imgClassName?: string;
  sizes?: string;
  profileId?: string;
}

function LinkImageCard({ link, index, className = "", imgClassName = "aspect-[4/3]", sizes, profileId }: LinkImageCardProps) {
  const handleClick = () => {
    try {
      const sessionId = typeof window !== "undefined" ? sessionStorage.getItem("lp_session_id") || "" : "";
      fetch("/api/track/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId: link.id, sessionId, url: link.url, itemTitle: link.title, blockType: link.type, profileId }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  };

  return (
    <motion.a
      href={link.url}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`glass flex rounded-[var(--radius-lg)] overflow-hidden shadow-sm hover:shadow-md transition-all group ${className}`}
    >
      <div className={`relative shrink-0 overflow-hidden bg-neutral-100 dark:bg-neutral-800 ${imgClassName}`}>
        {link.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={link.imageUrl}
            alt={link.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--accent)]/10 to-[var(--accent)]/5">
            <ExternalLink className="w-6 h-6 text-[var(--accent)]/40" />
          </div>
        )}
      </div>

      <div className="p-3 flex-1 flex flex-col justify-center min-w-0">
        <h3 className="font-semibold text-[var(--text-primary)] text-sm line-clamp-2 leading-snug">
          {link.title}
        </h3>
      </div>
    </motion.a>
  );
}

// ─── Link Story Card (full-bleed image with overlay text) ────────────────────
function LinkStoryCard({ link, index, profileId }: { link: Link; index: number; profileId?: string }) {
  const handleClick = () => {
    try {
      const sessionId = typeof window !== "undefined" ? sessionStorage.getItem("lp_session_id") || "" : "";
      fetch("/api/track/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId: link.id, sessionId, url: link.url, itemTitle: link.title, blockType: link.type, profileId }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  };

  return (
    <motion.a
      href={link.url}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="block relative w-full aspect-[3/4] rounded-[var(--radius-lg)] overflow-hidden group shadow-md"
    >
      {link.imageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={link.imageUrl}
          alt={link.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h3 className="text-white font-bold text-lg leading-tight mb-2">{link.title}</h3>
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white">
          Visitar <ExternalLink className="w-3 h-3" />
        </span>
      </div>
    </motion.a>
  );
}
