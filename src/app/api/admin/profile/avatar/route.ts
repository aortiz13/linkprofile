import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const VALID_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate type
    if (!VALID_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato inválido. Usa JPG, PNG o WebP." },
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "La imagen no puede superar 5MB." },
        { status: 400 }
      );
    }

    // Read and resize
    const buffer = Buffer.from(await file.arrayBuffer());
    const resized = await sharp(buffer)
      .resize(400, 400, { fit: "cover", position: "center" })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Save to filesystem
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const filename = `avatar.jpg`;
    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, resized);

    const avatarUrl = `/uploads/${filename}?t=${Date.now()}`;

    // Update profile
    await db
      .update(profiles)
      .set({ avatarUrl, updatedAt: new Date() })
      .where(eq(profiles.id, user.profileId));

    return NextResponse.json({ avatarUrl });
  } catch (error) {
    console.error("POST /api/admin/profile/avatar error:", error);
    return NextResponse.json(
      { error: "Error al subir la imagen" },
      { status: 500 }
    );
  }
}
