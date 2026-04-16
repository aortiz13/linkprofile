"use client";

import { ProfileHero } from "./ProfileHero";
import { LinkGrid } from "./LinkGrid";
import { LeadGenForm } from "./LeadGenForm";
import { TextBlock } from "./TextBlock";
import { VideoEmbed } from "./VideoEmbed";
import { DividerBlock } from "./DividerBlock";
import { SocialIconsBlock } from "./SocialIconsBlock";
import { ProductsBlock } from "./ProductsBlock";
import { GeoCustomBlock } from "./GeoCustomBlock";
import { AIGreeting } from "./AIGreeting";
import { CalComBlock } from "./CalComBlock";
import type { Block, Profile, Link } from "@/lib/db/schema";
import { getOrCreateSessionId } from "./LinkCard";

interface BlockRendererProps {
  block: Block;
  profile: Profile;
  links: Link[];
  aiFeatures?: Record<string, unknown>;
}

export function BlockRenderer({ block, profile, links, aiFeatures }: BlockRendererProps) {
  if (!block.visible) return null;

  const config = (block.config || {}) as Record<string, unknown>;

  const handleTrackClick = (url: string, itemTitle: string, blockType: string) => {
    try {
      const sessionId = getOrCreateSessionId();
      fetch("/api/track/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, itemTitle, blockType, sessionId, profileId: profile.id }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  };

  switch (block.type) {
    case "header": {
      const showAvatar = config.showAvatar !== false;
      const showBio = config.showBio !== false;
      const showUsername = config.showUsername !== false;
      return (
        <ProfileHero
          name={profile.name}
          username={showUsername ? profile.username : ""}
          bio={showBio ? profile.bio : null}
          avatarUrl={showAvatar ? profile.avatarUrl : null}
        />
      );
    }

    case "links": {
      const layout = (config.layout as string) || profile.layout || "list";
      const profileWithLayout = { ...profile, layout };
      return <LinkGrid profile={profileWithLayout} links={links} />;
    }

    case "contact_form": {
      const title = (config.title as string) || "Contáctame";
      return <LeadGenForm profileId={profile.id} title={title} />;
    }

    case "text": {
      const content = (config.content as string) || "";
      const title = (config.title as string) || "";
      const alignment = (config.alignment as "left" | "center" | "right") || "left";
      const transparentBackground = !!config.transparentBackground;
      return <TextBlock content={content} title={title} alignment={alignment} transparentBackground={transparentBackground} />;
    }

    case "video": {
      const url = (config.url as string) || "";
      const provider = (config.provider as string) || "youtube";
      return <VideoEmbed url={url} provider={provider} />;
    }

    case "divider": {
      const style = (config.style as "line" | "space" | "dots") || "line";
      const height = (config.height as number) || 32;
      return <DividerBlock style={style} height={height} />;
    }

    case "social_icons": {
      const icons = (config.icons as { platform: string; url: string; title?: string; subtitle?: string }[]) || [];
      const layout = (config.layout as "row" | "list") || "row";
      return <SocialIconsBlock icons={icons} layout={layout} onTrackClick={(url, title) => handleTrackClick(url, title, "social_icons")} />;
    }

    case "products": {
      const layout = (config.layout as string) || "grid";
      const products = (config.products as { id: string; url: string; title: string; image: string }[]) || [];
      return <ProductsBlock layout={layout} products={products} onTrackClick={(url, title) => handleTrackClick(url, title, "products")} />;
    }

    case "geo_custom": {
      return <GeoCustomBlock config={config} />;
    }

    case "ai_greeting": {
      const greetingTexts = (aiFeatures?.aiGreeting as Record<string, unknown>)?.texts as Record<string, string> | undefined;
      return <AIGreeting config={config} customTexts={greetingTexts} />;
    }

    case "cal_com": {
      const calConfig = (config.calData || {}) as Record<string, any>;
      return <CalComBlock {...calConfig} />;
    }

    default:
      return null;
  }
}
