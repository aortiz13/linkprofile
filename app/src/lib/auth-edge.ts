/**
 * Edge-compatible auth utilities (no Node.js native modules).
 * Used by middleware / proxy — only depends on `jose`.
 */
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-me-in-production"
);

export interface JWTPayload {
  sub: string;
  email: string;
  profileId: string;
}

export async function verifyToken(
  token: string
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}
