/**
 * Bootstrap script: ensures an admin user + default profile exist.
 * Runs via `prestart` → reads ADMIN_EMAIL / ADMIN_PASSWORD from env.
 * Safe to re-run: skips creation if the user already exists.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import * as schema from "./schema";

const BCRYPT_ROUNDS = 12;

async function bootstrap() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ DATABASE_URL not set – skipping bootstrap");
    process.exit(0);
  }

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log("⚠️  ADMIN_EMAIL / ADMIN_PASSWORD not set – skipping admin user creation");
    process.exit(0);
  }

  const client = postgres(url, { max: 1, idle_timeout: 5, connect_timeout: 10 });
  const db = drizzle(client, { schema });

  try {
    // 1. Check if admin already exists
    const existing = await db.query.adminUsers.findFirst({
      where: eq(schema.adminUsers.email, email),
    });

    if (existing) {
      console.log(`✅ Admin user already exists: ${email}`);
      await client.end();
      process.exit(0);
    }

    // 2. Ensure at least one profile exists (required FK for admin_users)
    let profile = await db.query.profiles.findFirst();

    if (!profile) {
      console.log("📝 Creating default profile...");
      const [newProfile] = await db
        .insert(schema.profiles)
        .values({
          username: "admin",
          name: "Admin",
          bio: "Bienvenido a LinkProfile",
        })
        .returning();
      profile = newProfile;
      console.log(`✅ Default profile created: @${profile.username}`);
    }

    // 3. Create admin user
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await db.insert(schema.adminUsers).values({
      email,
      passwordHash,
      profileId: profile.id,
    });

    console.log(`✅ Admin user created: ${email}`);
  } catch (err) {
    console.error("❌ Bootstrap error:", err);
    process.exit(1);
  }

  await client.end();
  process.exit(0);
}

bootstrap();
