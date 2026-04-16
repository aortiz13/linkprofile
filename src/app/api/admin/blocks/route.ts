import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { blocks, profiles } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

async function getProfileId() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user.profileId;
}

// GET — List all blocks for the profile, ordered
export async function GET() {
  const profileId = await getProfileId();
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let result = await db
    .select()
    .from(blocks)
    .where(eq(blocks.profileId, profileId))
    .orderBy(asc(blocks.order));

  // Auto-seed default blocks for profiles traversing to the new system
  if (result.length === 0) {
    result = await db
      .insert(blocks)
      .values([
        {
          profileId,
          type: "header",
          title: "Header",
          visible: true,
          order: 0,
          config: { showAvatar: true, showBio: true, showUsername: true },
        },
        {
          profileId,
          type: "links",
          title: "Links",
          visible: true,
          order: 1,
          config: { layout: "list" },
        },
        {
          profileId,
          type: "contact_form",
          title: "Formulario de contacto",
          visible: true,
          order: 2,
          config: { title: "Contáctame", fields: ["name", "email", "phone", "message"] },
        },
      ])
      .returning();
  }

  return NextResponse.json({ blocks: result });
}

// POST — Create a new block
export async function POST(req: Request) {
  const profileId = await getProfileId();
  if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { type, title, config } = body;

  if (!type) {
    return NextResponse.json({ error: "Block type is required" }, { status: 400 });
  }

  // Get max order
  const existing = await db
    .select({ order: blocks.order })
    .from(blocks)
    .where(eq(blocks.profileId, profileId))
    .orderBy(asc(blocks.order));

  const maxOrder = existing.length > 0 ? Math.max(...existing.map((b) => b.order)) + 1 : 0;

  const [newBlock] = await db
    .insert(blocks)
    .values({
      profileId,
      type,
      title: title || getDefaultTitle(type),
      visible: true,
      order: maxOrder,
      config: config || getDefaultConfig(type),
    })
    .returning();

  return NextResponse.json(newBlock, { status: 201 });
}

function getDefaultTitle(type: string): string {
  const titles: Record<string, string> = {
    header: "Header",
    links: "Links",
    contact_form: "Formulario de contacto",
    text: "Texto",
    video: "Video",
    divider: "Separador",
    social_icons: "Redes sociales",
  };
  return titles[type] || "Bloque";
}

function getDefaultConfig(type: string): Record<string, unknown> {
  const configs: Record<string, Record<string, unknown>> = {
    header: { showAvatar: true, showBio: true, showUsername: true },
    links: { layout: "list" },
    contact_form: { title: "Contáctame", fields: ["name", "email", "phone", "message"] },
    text: { content: "", alignment: "center" },
    video: { url: "", provider: "youtube" },
    divider: { style: "line", height: 32 },
    social_icons: { icons: [] },
  };
  return configs[type] || {};
}
