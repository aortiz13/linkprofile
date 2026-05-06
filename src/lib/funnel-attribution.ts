import { NextRequest, NextResponse } from "next/server";

export const FUNNEL_COOKIE = "lp_funnel_attr";
export const FUNNEL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface FunnelAttribution {
  slug: string;
  variant: string;
  sessionId: string;
  ts: number;
}

export function encodeAttribution(attr: FunnelAttribution): string {
  return Buffer.from(JSON.stringify(attr)).toString("base64url");
}

export function decodeAttribution(value: string | undefined): FunnelAttribution | null {
  if (!value) return null;
  try {
    const json = Buffer.from(value, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as FunnelAttribution;
    if (!parsed.slug || !parsed.variant || !parsed.sessionId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readAttribution(req: NextRequest): FunnelAttribution | null {
  return decodeAttribution(req.cookies.get(FUNNEL_COOKIE)?.value);
}

export function setAttributionCookie(res: NextResponse, attr: FunnelAttribution): void {
  res.cookies.set(FUNNEL_COOKIE, encodeAttribution(attr), {
    maxAge: FUNNEL_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    httpOnly: false, // Needs to be readable by client-side Stripe CTA components
    secure: process.env.NODE_ENV === "production",
  });
}
