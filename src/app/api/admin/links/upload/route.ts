import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const VALID_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!VALID_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato inválido. Usa JPG, PNG, WebP o GIF." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "La imagen no puede superar 5MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const resized = await sharp(buffer)
      .resize(600, 600, { fit: "cover", position: "center" })
      .jpeg({ quality: 85 })
      .toBuffer();

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "links");
    await mkdir(uploadsDir, { recursive: true });

    const filename = `link-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.jpg`;
    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, resized);

    const imageUrl = `/uploads/links/${filename}`;

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("POST /api/admin/links/upload error:", error);
    return NextResponse.json(
      { error: "Error al subir la imagen" },
      { status: 500 }
    );
  }
}
