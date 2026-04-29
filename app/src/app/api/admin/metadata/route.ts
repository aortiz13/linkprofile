import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const urlParam = searchParams.get("url");

  if (!urlParam) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    // Basic validation
    new URL(urlParam);

    const response = await fetch(urlParam, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 LinkProfileBot/1.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      // Timeout after 5 seconds
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch URL" }, { status: response.status });
    }

    const html = await response.text();

    // Regex parsing for OG tags and Title
    let title = "";
    let image = "";

    // 1. Try to find og:title or twitter:title
    const ogTitleMatch = html.match(/<meta[^>]*(?:property|name)=["'](?:og:title|twitter:title)["'][^>]*content=["']([^"']+)["'][^>]*>/i) 
                      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:title|twitter:title)["'][^>]*>/i);
    
    // 2. Fallback to <title>
    const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);

    if (ogTitleMatch && ogTitleMatch[1]) {
      title = ogTitleMatch[1];
    } else if (titleTagMatch && titleTagMatch[1]) {
      title = titleTagMatch[1];
    }

    // 3. Try to find og:image or twitter:image
    const ogImageMatch = html.match(/<meta[^>]*(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*content=["']([^"']+)["'][^>]*>/i)
                      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*>/i);

    if (ogImageMatch && ogImageMatch[1]) {
      image = ogImageMatch[1];
    } else {
      // 4. Fallback to apple-touch-icon
      const appleTouchMatch = html.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["'][^>]*>/i)
                           || html.match(/<meta[^>]*name=["']apple-touch-icon["'][^>]*content=["']([^"']+)["'][^>]*>/i);
      
      if (appleTouchMatch && appleTouchMatch[1]) {
        image = appleTouchMatch[1];
      } else {
        // 5. Fallback to standard icon/favicon
        const iconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["'][^>]*>/i);
        if (iconMatch && iconMatch[1]) {
          image = iconMatch[1];
        }
      }
    }

    if (image) {
      try {
        image = new URL(image, urlParam).href;
      } catch (error) {
        // Keep original if invalid
      }
    }

    // Clean up HTML entities in title
    title = title
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();

    return NextResponse.json({
      url: urlParam,
      title: title || "Link",
      image: image || null,
    });
  } catch (error) {
    console.error("Metadata fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch metadata" }, { status: 500 });
  }
}
