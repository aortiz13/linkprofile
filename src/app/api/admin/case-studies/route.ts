import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// Fetch case studies from the Brandboost GitHub repo
// Uses raw.githubusercontent.com to avoid API rate limits and parses the TS file
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Use raw content URL — no auth required for public repos, no rate limits
    const res = await fetch(
      "https://raw.githubusercontent.com/aortiz13/web-Brandboost/main/data/caseStudies.ts",
      { next: { revalidate: 300 } } // cache 5 min
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch case studies from GitHub", status: res.status },
        { status: 502 }
      );
    }

    const content = await res.text();

    // Parse the TypeScript file to extract case study objects
    const studies = parseCaseStudies(content);

    return NextResponse.json({ studies });
  } catch (error) {
    console.error("GET /api/admin/case-studies error:", error);
    return NextResponse.json(
      { error: "Error al obtener casos de estudio" },
      { status: 500 }
    );
  }
}

interface ParsedStudy {
  id: string;
  client: string;
  title: string;
  image: string;
  logo: string;
  industry: string;
  excerpt: string;
}

function parseCaseStudies(content: string): ParsedStudy[] {
  const studies: ParsedStudy[] = [];

  // Split the file into blocks by finding top-level objects in the array
  // Each block starts with `{` + newline + `id:` pattern
  const blockRegex = /\{\s*\n\s*id:\s*['"]([^'"]+)['"]/g;
  const ids: { id: string; pos: number }[] = [];
  let match;

  while ((match = blockRegex.exec(content)) !== null) {
    ids.push({ id: match[1], pos: match.index });
  }

  for (let i = 0; i < ids.length; i++) {
    const { id, pos } = ids[i];
    // Extract the block from this position to the next block (or end of file)
    const endPos = i + 1 < ids.length ? ids[i + 1].pos : content.length;
    const block = content.slice(pos, endPos);

    // Only look at the header portion (before "sidebar:" or "content:")
    const headerEnd = block.search(/\b(sidebar|content)\s*[:]/);
    const header = headerEnd !== -1 ? block.slice(0, headerEnd) : block.slice(0, 800);

    const getField = (field: string): string => {
      // Match: field: 'value' or field: "value" or "field": "value"
      const patterns = [
        new RegExp(`${field}:\\s*'([^']*?)'`),
        new RegExp(`${field}:\\s*"([^"]*?)"`),
        new RegExp(`"${field}":\\s*"([^"]*?)"`),
      ];
      for (const regex of patterns) {
        const m = header.match(regex);
        if (m) return m[1];
      }
      return "";
    };

    const client = getField("client");
    const title = getField("title");
    const image = getField("image");
    const logo = getField("logo");
    const industry = getField("industry");
    const excerpt = getField("excerpt");

    if (id && (title || client)) {
      studies.push({ id, client, title, image, logo, industry, excerpt });
    }
  }

  return studies;
}
