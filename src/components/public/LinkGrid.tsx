"use client";

import { AnimatePresence } from "framer-motion";
import { LinkCard } from "./LinkCard";
import { LeadGenForm } from "./LeadGenForm";
import type { Link, Profile } from "@/lib/db/schema";

interface LinkGridProps {
  profile: Profile;
  links: Link[];
}

export function LinkGrid({ profile, links }: LinkGridProps) {
  const isBento = profile.layout === "bento";

  return (
    <div className="w-full flex flex-col gap-6">
      {profile.leadgenEnabled && (
        <LeadGenForm profileId={profile.id} title={profile.leadgenTitle || undefined} />
      )}

      {links.length > 0 && (
        <div className={isBento ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"}>
          <AnimatePresence mode="popLayout">
            {links.map((link, index) => (
              <LinkCard key={link.id} link={link} index={index} isBento={isBento} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
