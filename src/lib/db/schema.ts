import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

// ─── Profile ─────────────────────────────────────────────────────────────────
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  
  // New Theme & Layout Config
  theme: text("theme").notNull().default("light"), // 'light', 'dark', 'remax'
  layout: text("layout").notNull().default("list"), // 'list', 'bento'
  
  // New Sticky Contact Config
  whatsappNumber: text("whatsapp_number"),
  vcardUrl: text("vcard_url"),
  
  // New Lead Gen Config
  leadgenEnabled: boolean("leadgen_enabled").notNull().default(false),
  leadgenTitle: text("leadgen_title"),

  // AI Features Config
  aiFeatures: jsonb("ai_features").default({}),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Leads ───────────────────────────────────────────────────────────────────
export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  message: text("message"),
  source: text("source"),
  country: text("country"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Links ───────────────────────────────────────────────────────────────────
export const links = pgTable(
  "links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    url: text("url").notNull(),
    type: text("type").notNull().default("custom"),
    // types: custom | instagram | whatsapp | email | tiktok | youtube | twitter | ai_ref
    icon: text("icon"), // lucide icon name or custom URL
    imageUrl: text("image_url"), // optional thumbnail/image for the link
    active: boolean("active").notNull().default(true),
    order: integer("order").notNull().default(0),
    metadata: jsonb("metadata"), // e.g. { handle: 'myprofile' } for deep links
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("links_profile_idx").on(t.profileId),
    index("links_order_idx").on(t.profileId, t.order),
  ]
);

// ─── Page Views ──────────────────────────────────────────────────────────────
export const pageViews = pgTable(
  "page_views",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id),
    sessionId: text("session_id").notNull(),
    ip: text("ip"), // hashed with SHA-256 for privacy
    country: text("country"), // ISO 3166-1 alpha-2
    countryName: text("country_name"),
    city: text("city"),
    device: text("device"), // mobile | desktop | tablet
    os: text("os"),
    browser: text("browser"),
    referrer: text("referrer"),
    userAgent: text("user_agent"),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
  },
  (t) => [
    index("page_views_profile_ts_idx").on(t.profileId, t.timestamp),
    index("page_views_session_idx").on(t.sessionId),
    index("page_views_country_idx").on(t.country),
  ]
);

// ─── Link Clicks ─────────────────────────────────────────────────────────────
export const linkClicks = pgTable(
  "link_clicks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    linkId: uuid("link_id")
      .references(() => links.id, { onDelete: "cascade" }),
    url: text("url"),
    itemTitle: text("item_title"),
    blockType: text("block_type"),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id),
    sessionId: text("session_id").notNull(),
    ip: text("ip"),
    country: text("country"),
    device: text("device"),
    os: text("os"),
    browser: text("browser"),
    referrer: text("referrer"),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
  },
  (t) => [
    index("link_clicks_link_ts_idx").on(t.linkId, t.timestamp),
    index("link_clicks_profile_ts_idx").on(t.profileId, t.timestamp),
  ]
);

// ─── Admin Users ─────────────────────────────────────────────────────────────
export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(), // bcrypt cost 12
  profileId: uuid("profile_id").references(() => profiles.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

// ─── Blocks (Page Builder) ───────────────────────────────────────────────────
export const blocks = pgTable(
  "blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // header | links | contact_form | text | video | divider | social_icons
    title: text("title"),
    visible: boolean("visible").notNull().default(true),
    order: integer("order").notNull().default(0),
    config: jsonb("config").notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("blocks_profile_order_idx").on(t.profileId, t.order),
  ]
);

// ─── Type exports ────────────────────────────────────────────────────────────
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Link = typeof links.$inferSelect;
export type NewLink = typeof links.$inferInsert;
export type PageView = typeof pageViews.$inferSelect;
export type NewPageView = typeof pageViews.$inferInsert;
export type LinkClick = typeof linkClicks.$inferSelect;
export type NewLinkClick = typeof linkClicks.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Block = typeof blocks.$inferSelect;
export type NewBlock = typeof blocks.$inferInsert;
