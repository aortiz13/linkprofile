"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

interface CaseStudy {
  id: string;
  title: string;
  image: string;
  client: string;
  url: string;
}

interface CaseStudiesBlockProps {
  studies: CaseStudy[];
  baseUrl?: string;
  onTrackClick?: (url: string, title: string) => void;
}

export function CaseStudiesBlock({ studies, baseUrl, onTrackClick }: CaseStudiesBlockProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = studies.length;

  if (!total) return null;

  const scrollToIndex = useCallback((idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const slide = el.children[idx] as HTMLElement | undefined;
    if (!slide) return;
    el.scrollTo({ left: slide.offsetLeft - el.offsetLeft, behavior: "smooth" });
  }, []);

  // Track active slide from scroll position
  const updateActiveFromScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollCenter = el.scrollLeft + el.clientWidth / 2;
    let closest = 0;
    let closestDist = Infinity;
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i] as HTMLElement;
      const childCenter = child.offsetLeft - el.offsetLeft + child.offsetWidth / 2;
      const dist = Math.abs(scrollCenter - childCenter);
      if (dist < closestDist) { closestDist = dist; closest = i; }
    }
    setActiveIndex(closest);
  }, []);

  // Auto-play: advance every 4.5s
  const startAutoPlay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % total;
        scrollToIndex(next);
        return next;
      });
    }, 4500);
  }, [total, scrollToIndex]);

  const stopAutoPlay = useCallback(() => {
    if (autoPlayRef.current) { clearInterval(autoPlayRef.current); autoPlayRef.current = null; }
  }, []);

  useEffect(() => {
    startAutoPlay();
    return stopAutoPlay;
  }, [startAutoPlay, stopAutoPlay]);

  // Pause auto-play while user is touching
  const handleTouchStart = () => stopAutoPlay();
  const handleTouchEnd = () => {
    // Small delay to let scroll snap settle
    setTimeout(updateActiveFromScroll, 150);
    startAutoPlay();
  };

  return (
    <div className="w-full">
      {/* Slides — native horizontal scroll with hidden scrollbar */}
      <div
        ref={scrollRef}
        onScroll={updateActiveFromScroll}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={stopAutoPlay}
        onMouseLeave={startAutoPlay}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-1"
        style={{
          scrollbarWidth: "none",       /* Firefox */
          msOverflowStyle: "none",      /* IE/Edge */
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Inline style to hide WebKit scrollbar */}
        <style>{`.case-scroll::-webkit-scrollbar { display: none; }`}</style>

        {studies.map((study, i) => {
          const href = study.url || `${baseUrl || ""}/casos-de-exito/${study.id}`;

          return (
            <motion.a
              key={study.id}
              href={href}
              onClick={() => onTrackClick?.(href, study.title)}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="min-w-[85%] max-w-[320px] shrink-0 snap-center relative aspect-[3/4] rounded-[var(--radius-lg)] overflow-hidden group shadow-md cursor-pointer"
            >
              {/* Image */}
              {study.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={study.image}
                  alt={study.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/30 to-[var(--accent)]/10" />
              )}

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

              {/* Content overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col gap-2">
                <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                  {study.client}
                </span>
                <h3 className="text-white font-bold text-base leading-snug line-clamp-3">
                  {study.title}
                </h3>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-white/15 backdrop-blur-md rounded-full text-white w-fit mt-1 group-hover:bg-white/25 transition-colors">
                  Ver caso <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </motion.a>
          );
        })}
      </div>

      {/* Dot indicators */}
      {total > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {studies.map((_, i) => (
            <button
              key={i}
              onClick={() => { scrollToIndex(i); setActiveIndex(i); startAutoPlay(); }}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? "bg-[var(--accent)] w-6"
                  : "bg-[var(--text-muted)]/30 hover:bg-[var(--text-muted)]/50 w-2"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
