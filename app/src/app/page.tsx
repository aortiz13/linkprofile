import { db } from "@/lib/db";
import { profiles, links, blocks } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { AnimatedBackground } from "@/components/public/AnimatedBackground";
import { BlockRenderer } from "@/components/public/BlockRenderer";
import { TrackVisit } from "@/components/public/TrackVisit";
import { Footer } from "@/components/public/Footer";
import { MoodThemeProvider } from "@/components/public/MoodThemeProvider";
import { PredictionEngine } from "@/components/public/PredictionEngine";

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

async function getProfileData() {
  try {
    const profile = await db.query.profiles.findFirst();
    if (!profile) return null;

    const activeLinks = await db
      .select()
      .from(links)
      .where(and(eq(links.profileId, profile.id), eq(links.active, true)))
      .orderBy(asc(links.order));

    const pageBlocks = await db
      .select()
      .from(blocks)
      .where(eq(blocks.profileId, profile.id))
      .orderBy(asc(blocks.order));

    return { profile, links: activeLinks, blocks: pageBlocks };
  } catch {
    return null;
  }
}

export default async function PublicPage() {
  const data = await getProfileData();

  if (!data) {
    return (
      <main className="flex-1 flex items-center justify-center relative">
        <AnimatedBackground />
        <div className="relative z-10 text-center p-8">
          <h1 className="text-2xl font-bold mb-2">LinkProfile</h1>
          <p className="text-[var(--text-muted)]">
            Perfil no configurado. Accede al panel admin para comenzar.
          </p>
        </div>
      </main>
    );
  }

  const { profile, links: activeLinks, blocks: pageBlocks } = data;

  // If no blocks exist yet, render the legacy fixed layout
  const hasBlocks = pageBlocks.length > 0;

  return (
    <main data-theme={profile.theme} className="bg-[var(--bg-base)] text-[var(--text-primary)] fade-in w-full min-h-screen flex flex-col items-center relative">
      <AnimatedBackground theme={profile.theme} />
      <TrackVisit />
      <MoodThemeProvider />
      <PredictionEngine aiFeatures={(profile.aiFeatures as Record<string, unknown>) || {}} />

      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-10">
        {hasBlocks ? (
          <div className="flex flex-col gap-4">
            {pageBlocks.map((block) => {
              // Filter links per block: each "links" block shows only its own links
              let blockLinks = activeLinks;
              if (block.type === "links") {
                const ownLinks = activeLinks.filter((l) => l.blockId === block.id);
                const unassigned = activeLinks.filter((l) => !l.blockId);
                // If this block has its own links, use them. Otherwise, check if it's the first links block — assign unassigned links to it.
                if (ownLinks.length > 0) {
                  blockLinks = ownLinks;
                } else {
                  const firstLinksBlock = pageBlocks.find((b) => b.type === "links");
                  blockLinks = firstLinksBlock?.id === block.id ? unassigned : [];
                }
              }
              return (
                <BlockRenderer
                  key={block.id}
                  block={block}
                  profile={profile}
                  links={blockLinks}
                  aiFeatures={(profile.aiFeatures as Record<string, unknown>) || {}}
                />
              );
            })}
          </div>
        ) : (
          <>
            {/* Legacy fallback */}
            <div>Perfil sin bloques configurados.</div>
          </>
        )}

        <Footer />
      </div>
    </main>
  );
}
