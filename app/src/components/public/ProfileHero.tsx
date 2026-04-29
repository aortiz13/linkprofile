"use client";

import { motion } from "framer-motion";
import { ProfileAvatar } from "./ProfileAvatar";
import { useState } from "react";

interface ProfileHeroProps {
  name: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
}

export function ProfileHero({ name, username, bio, avatarUrl }: ProfileHeroProps) {
  const [expanded, setExpanded] = useState(false);
  const maxBioLength = 160;
  const shouldTruncate = bio && bio.length > maxBioLength;
  const displayBio = shouldTruncate && !expanded ? bio.slice(0, maxBioLength) + "..." : bio;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="glass rounded-[var(--radius-xl)] p-8 text-center mb-6"
    >
      {/* Avatar */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex justify-center mb-4"
      >
        <ProfileAvatar src={avatarUrl} name={name} size={96} />
      </motion.div>

      {/* Username */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-sm text-[var(--text-muted)] mb-1"
      >
        @{username}
      </motion.p>

      {/* Name */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="text-2xl font-bold tracking-tight mb-2"
      >
        {name}
      </motion.h1>

      {/* Bio */}
      {bio && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-md mx-auto">
            {displayBio}
          </p>
          {shouldTruncate && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-[var(--accent-light)] hover:text-[var(--accent)] mt-1 transition-colors"
            >
              {expanded ? "Ver menos" : "Ver más"}
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
