"use client";

import { useQuery } from "@tanstack/react-query";
import { BlockRenderer } from "@/components/public/BlockRenderer";
import { AnimatedBackground } from "@/components/public/AnimatedBackground";
import { Loader2 } from "lucide-react";
import type { Block, Profile, Link } from "@/lib/db/schema";

export function LivePreview() {
  const { data: profile, isLoading: loadingProfile } = useQuery<Profile>({
    queryKey: ["admin-profile"],
    queryFn: async () => {
      const res = await fetch("/api/admin/profile");
      return res.json();
    },
  });

  const { data: linksData, isLoading: loadingLinks } = useQuery<{ links: Link[] }>({
    queryKey: ["admin-links"],
    queryFn: async () => {
      const res = await fetch("/api/admin/links");
      return res.json();
    },
  });

  const { data: blocksData, isLoading: loadingBlocks } = useQuery<{ blocks: Block[] }>({
    queryKey: ["admin-blocks"],
    queryFn: async () => {
      const res = await fetch("/api/admin/blocks");
      return res.json();
    },
  });

  const isLoading = loadingProfile || loadingLinks || loadingBlocks;
  const theme = profile?.theme || "light";
  const activeLinks = (linksData?.links || []).filter((l) => l.active);
  const pageBlocks = blocksData?.blocks || [];

  return (
    <div className="sticky top-8 w-[320px] h-[650px] border-[8px] border-neutral-900 rounded-[2.5rem] overflow-hidden bg-black shadow-2xl mx-auto flex flex-col relative z-0">
      {/* Notch */}
      <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50">
        <div className="w-32 h-6 bg-neutral-900 rounded-b-2xl"></div>
      </div>
      
      <div 
        className={`w-full h-full overflow-y-auto overflow-x-hidden relative flex flex-col items-center bg-[var(--bg-base)]`}
        style={{"--bg-base": theme === "dark" ? "#0f172a" : theme === "remax" ? "#f8f9fa" : "#ffffff"} as React.CSSProperties}
      >
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
          </div>
        ) : (
          <>
            <div className="absolute inset-0 z-0">
              <AnimatedBackground />
            </div>
            
            <div className="relative z-10 w-full px-4 py-10 flex-col flex gap-3">
              {profile && pageBlocks.length > 0 ? (
                pageBlocks.map((block) => (
                  <BlockRenderer
                    key={block.id}
                    block={block}
                    profile={profile as unknown as Profile}
                    links={activeLinks as Link[]}
                  />
                ))
              ) : (
                <p className="text-center text-sm text-[var(--text-muted)] mt-10">
                  Sin bloques
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
