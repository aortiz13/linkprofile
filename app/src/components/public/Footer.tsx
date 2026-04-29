"use client";

import { motion } from "framer-motion";

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 0.5 }}
      className="mt-8 mb-6 text-center"
    >
      <p className="text-xs text-[var(--text-muted)] tracking-widest uppercase">
        linkprofile
      </p>
    </motion.footer>
  );
}
