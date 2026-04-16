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
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  if (!studies.length) return null;

  const total = studies.length;

  const goTo = useCallback((idx: number) => {
    setActiveIndex(((idx % total) + total) % total);
  }, [total]);

  const next = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const prev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  // Auto-play loop
  useEffect(() => {
    autoPlayRef.current = setInterval(next, 4500);
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [next]);

  const pauseAutoPlay = () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  const resumeAutoPlay = () => {
    pauseAutoPlay();
    autoPlayRef.current = setInterval(next, 4500);
  };

  // Touch / drag handling
  const handleDragStart = (x: number) => { setIsDragging(true); startX.current = x; pauseAutoPlay(); };
  const handleDragEnd = (x: number) => {
    setIsDragging(false);
    const diff = startX.current - x;
    if (Math.abs(diff) > 50) { diff > 0 ? next() : prev(); }
    resumeAutoPlay();
  };

  return (
    <div
      className="w-full relative overflow-hidden"
      onMouseEnter={pauseAutoPlay}
      onMouseLeave={resumeAutoPlay}
    >
      {/* Slides container */}
      <div
        className="relative"
        style={{ touchAction: "pan-y" }}
        onMouseDown={(e) => handleDragStart(e.clientX)}
        onMouseUp={(e) => handleDragEnd(e.clientX)}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
        onTouchEnd={(e) => handleDragEnd(e.changedTouches[0].clientX)}
      >
        <motion.div
          className="flex"
          animate={{ x: `${-activeIndex * 100}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 35 }}
          style={{ width: `${total * 100}%` }}
        >
          {studies.map((study, i) => {
            const href = study.url || `${baseUrl || ""}/casos-de-exito/${study.id}`;

            return (
              <div
                key={study.id}
                className="px-2"
                style={{ width: `${100 / total}%` }}
              >
                <motion.a
                  href={href}
                  onClick={(e) => {
                    if (isDragging) { e.preventDefault(); return; }
                    onTrackClick?.(href, study.title);
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  className="block relative aspect-[3/4] rounded-[var(--radius-lg)] overflow-hidden group shadow-md cursor-pointer"
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
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* Dot indicators */}
      {total > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {studies.map((_, i) => (
            <button
              key={i}
              onClick={() => { goTo(i); resumeAutoPlay(); }}
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
