import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// Fetch case studies from the Brandboost GitHub repo
// Parses the data/caseStudies.ts TypeScript file and extracts case study entries
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Fetch the raw file from GitHub
    const res = await fetch(
      "https://api.github.com/repos/aortiz13/web-Brandboost/contents/data/caseStudies.ts",
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          ...(process.env.GITHUB_TOKEN
            ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
            : {}),
        },
        next: { revalidate: 300 }, // cache 5 min
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch case studies from GitHub", status: res.status },
        { status: 502 }
      );
    }

    const data = await res.json();
    const content = Buffer.from(data.content, "base64").toString("utf-8");

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

  // Extract each case study block by finding id patterns
  // Uses regex to find each object's key fields
  const idRegex = /id:\s*['"]([^'"]+)['"]/g;
  const ids: string[] = [];
  let match;
  while ((match = idRegex.exec(content)) !== null) {
    ids.push(match[1]);
  }

  for (const id of ids) {
    // Find the block starting from this id
    const idPos = content.indexOf(`id: '${id}'`) !== -1
      ? content.indexOf(`id: '${id}'`)
      : content.indexOf(`id: "${id}"`);

    if (idPos === -1) continue;

    // Extract a window of text around this id to find sibling fields
    // Go back to find the opening { and forward to find sidebar/content
    const blockStart = content.lastIndexOf("{", idPos);
    const sidebarPos = content.indexOf("sidebar:", idPos);
    const blockSlice = sidebarPos !== -1
      ? content.slice(blockStart, sidebarPos)
      : content.slice(blockStart, blockStart + 1000);

    const getField = (field: string): string => {
      // Match both single and double quoted strings, also template literals
      const regex = new RegExp(`${field}:\\s*['"\`]([^'"\`]*?)['"\`]`);
      const m = blockSlice.match(regex);
      return m ? m[1] : "";
    };

    // For multi-line or escaped strings, also check with double quotes
    const getFieldAlt = (field: string): string => {
      const regex = new RegExp(`\\\\?"${field}\\\\?":\\s*\\\\?"([^"]*?)\\\\?"`);
      const m = blockSlice.match(regex);
      return m ? m[1] : "";
    };

    const client = getField("client") || getFieldAlt("client");
    const title = getField("title") || getFieldAlt("title");
    const image = getField("image") || getFieldAlt("image");
    const logo = getField("logo") || getFieldAlt("logo");
    const industry = getField("industry") || getFieldAlt("industry");
    const excerpt = getField("excerpt") || getFieldAlt("excerpt");

    if (id && title) {
      studies.push({ id, client, title, image, logo, industry, excerpt });
    }
  }

  return studies;
}
