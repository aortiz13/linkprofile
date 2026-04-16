import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "./index";
import { profiles, links, adminUsers, linkClicks, pageViews } from "./schema";
import bcrypt from "bcrypt";

async function seed() {
  console.log("🌱 Seeding database...");

  // Clean existing data (respect FK order)
  await db.delete(adminUsers);
  await db.delete(linkClicks);
  await db.delete(pageViews);
  await db.delete(links);
  await db.delete(profiles);

  // Create demo profile
  const [profile] = await db
    .insert(profiles)
    .values({
      username: "adrian",
      name: "Adrian Ortiz",
      bio: "Full Stack Developer & Creator. Building digital experiences that matter. 🚀",
      avatarUrl: null,
    })
    .returning();

  console.log(`✅ Profile created: ${profile.name} (@${profile.username})`);

  // Create demo links
  const demoLinks = [
    {
      profileId: profile.id,
      title: "Instagram",
      url: "https://instagram.com/adrianortiz",
      type: "instagram",
      icon: "instagram",
      active: true,
      order: 0,
      metadata: { handle: "adrianortiz" },
    },
    {
      profileId: profile.id,
      title: "TikTok",
      url: "https://tiktok.com/@adrianortiz",
      type: "tiktok",
      icon: "music",
      active: true,
      order: 1,
      metadata: { handle: "adrianortiz" },
    },
    {
      profileId: profile.id,
      title: "WhatsApp — Contacto",
      url: "https://wa.me/56912345678",
      type: "whatsapp",
      icon: "message-circle",
      active: true,
      order: 2,
      metadata: { handle: "56912345678" },
    },
    {
      profileId: profile.id,
      title: "YouTube",
      url: "https://youtube.com/@adrianortiz",
      type: "youtube",
      icon: "youtube",
      active: true,
      order: 3,
      metadata: { handle: "adrianortiz" },
    },
    {
      profileId: profile.id,
      title: "Mi Portfolio",
      url: "https://adrian-ortiz.com",
      type: "custom",
      icon: "globe",
      active: true,
      order: 4,
    },
    {
      profileId: profile.id,
      title: "Escríbeme un Email",
      url: "mailto:hola@adrian-ortiz.com",
      type: "email",
      icon: "mail",
      active: true,
      order: 5,
    },
    {
      profileId: profile.id,
      title: "ChatGPT Plus — 20% off",
      url: "https://chat.openai.com/referral/link",
      type: "ai_ref",
      icon: "bot",
      active: true,
      order: 6,
    },
  ];

  await db.insert(links).values(demoLinks);
  console.log(`✅ ${demoLinks.length} demo links created`);

  // Create admin user
  const passwordHash = await bcrypt.hash("admin123", 12);
  await db.insert(adminUsers).values({
    email: "admin@adrian-ortiz.com",
    passwordHash,
    profileId: profile.id,
  });
  console.log(`✅ Admin user created: admin@adrian-ortiz.com / admin123`);

  console.log("\n🎉 Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
