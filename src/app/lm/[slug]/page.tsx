import { db } from "@/lib/db";
import { leadMagnets, profiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LeadMagnetForm } from "./LeadMagnetForm";

// Revalidate every 60 seconds
export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [magnet] = await db
    .select()
    .from(leadMagnets)
    .where(and(eq(leadMagnets.slug, slug), eq(leadMagnets.active, true)))
    .limit(1);

  if (!magnet) {
    return { title: "No encontrado" };
  }

  return {
    title: magnet.title,
    description: magnet.description || "Obtén tu recurso gratuito",
    openGraph: {
      title: magnet.title,
      description: magnet.description || "Obtén tu recurso gratuito",
      type: "website",
    },
  };
}

export default async function LeadMagnetPage({ params }: PageProps) {
  const { slug } = await params;

  const [magnet] = await db
    .select()
    .from(leadMagnets)
    .where(and(eq(leadMagnets.slug, slug), eq(leadMagnets.active, true)))
    .limit(1);

  if (!magnet) {
    notFound();
  }

  // Get profile for theming
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, magnet.profileId))
    .limit(1);

  return (
    <main
      data-theme={profile?.theme || "dark"}
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: "var(--bg-base)",
        color: "var(--text-primary)",
      }}
    >
      {/* Animated background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(6, 182, 212, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(139, 92, 246, 0.06) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-8">
        <LeadMagnetForm
          slug={magnet.slug}
          title={magnet.title}
          description={magnet.description}
          buttonText={magnet.buttonText}
          coverImage={magnet.coverImage}
          showName={magnet.showName}
          showEmail={magnet.showEmail}
          showWhatsapp={magnet.showWhatsapp}
          showOccupation={magnet.showOccupation}
          occupationOptions={magnet.occupationOptions as string[]}
        />
      </div>
    </main>
  );
}
