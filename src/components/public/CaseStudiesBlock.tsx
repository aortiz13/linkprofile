"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useState, useRef, useEffect } from "react";

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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!studies.length) return null;

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);

    // Calculate active index based on scroll position
    const slideWidth = el.firstElementChild?.clientWidth || 1;
    const gap = 16;
    const idx = Math.round(el.scrollLeft / (slideWidth + gap));
    setActiveIndex(Math.min(idx, studies.length - 1));
  };

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const slideWidth = el.firstElementChild?.clientWidth || 300;
    el.scrollBy({ left: dir === "left" ? -slideWidth - 16 : slideWidth + 16, behavior: "smooth" });
  };

  return (
    <div className="w-full relative group/slider">
      {/* Navigation arrows */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 dark:bg-black/70 shadow-lg backdrop-blur-sm flex items-center justify-center text-neutral-700 dark:text-white hover:scale-110 transition-transform opacity-0 group-hover/slider:opacity-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 dark:bg-black/70 shadow-lg backdrop-blur-sm flex items-center justify-center text-neutral-700 dark:text-white hover:scale-110 transition-transform opacity-0 group-hover/slider:opacity-100"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Slides */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-3 -mx-4 px-4"
      >
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
      {studies.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {studies.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                const el = scrollRef.current;
                if (!el || !el.firstElementChild) return;
                const slideWidth = el.firstElementChild.clientWidth + 16;
                el.scrollTo({ left: slideWidth * i, behavior: "smooth" });
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                i === activeIndex
                  ? "bg-[var(--accent)] w-6"
                  : "bg-[var(--text-muted)]/30 hover:bg-[var(--text-muted)]/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
