import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, createToken, setAuthCookie } from "@/lib/auth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Find user
    const user = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.email, email),
    });

    if (!user) {
      // Generic error to not reveal user existence
      return NextResponse.json(
        { error: "Credenciales incorrectas" },
        { status: 401 }
      );
    }

    // Verify password
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Credenciales incorrectas" },
        { status: 401 }
      );
    }

    // Create JWT and set cookie
    const token = await createToken({
      sub: user.id,
      email: user.email,
      profileId: user.profileId || "",
    });

    await setAuthCookie(token);

    // Update last login
    await db
      .update(adminUsers)
      .set({ lastLoginAt: new Date() })
      .where(eq(adminUsers.id, user.id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      { error: "Error del servidor" },
      { status: 500 }
    );
  }
}
