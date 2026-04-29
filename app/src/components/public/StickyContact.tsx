"use client";

import { motion } from "framer-motion";
import { MessageCircle, UserPlus } from "lucide-react";
import type { Profile } from "@/lib/db/schema";

interface StickyContactProps {
  whatsappNumber: string | null;
  vcardUrl: string | null;
}

export function StickyContact({ whatsappNumber, vcardUrl }: StickyContactProps) {
  if (!whatsappNumber && !vcardUrl) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 200, damping: 20 }}
      className="fixed bottom-6 left-0 right-0 z-50 px-4 flex justify-center gap-4 pointer-events-none"
    >
      <div className="flex gap-3 pointer-events-auto">
        {whatsappNumber && (
          <a
            href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-3 bg-[#25D366] text-white rounded-full shadow-lg shadow-green-500/20 hover:scale-105 active:scale-95 transition-transform"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium text-sm">WhatsApp</span>
          </a>
        )}
        
        {vcardUrl && (
          <a
            href={vcardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-3 bg-white text-black rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform border border-gray-100"
          >
            <UserPlus className="w-5 h-5" />
            <span className="font-medium text-sm">Guardar</span>
          </a>
        )}
      </div>
    </motion.div>
  );
}
