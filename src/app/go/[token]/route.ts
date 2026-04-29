import { NextRequest, NextResponse } from "next/server";
import { handleLinkClick } from "@/lib/whatsapp-agent";

// Short URL redirect: /go/a3f1b2c4 → tracks click + redirects to asesorias
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token) {
    return NextResponse.redirect("https://adrian-ortiz.com/asesorias");
  }

  try {
    const targetUrl = await handleLinkClick(token);

    if (!targetUrl) {
      // Invalid token — redirect to asesorias anyway
      return NextResponse.redirect("https://adrian-ortiz.com/asesorias");
    }

    return NextResponse.redirect(targetUrl);
  } catch (error) {
    console.error("GET /go/[token] error:", error);
    return NextResponse.redirect("https://adrian-ortiz.com/asesorias");
  }
}
