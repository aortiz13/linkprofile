import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-edge";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /admin routes (except /admin/login)
  if (!pathname.startsWith("/admin") || pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Check for auth cookie
  const token = req.cookies.get("linkprofile-session")?.value;

  if (!token) {
    return NextResponse.redirect(
      new URL("/admin/login?callbackUrl=" + encodeURIComponent(pathname), req.url)
    );
  }

  // Verify token
  const user = await verifyToken(token);
  if (!user) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
