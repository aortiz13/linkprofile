import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSources } from "@/lib/analytics-queries";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from")
    ? new Date(searchParams.get("from")!)
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date();

  const data = await getSources({ from, to, profileId: user.profileId });
  return NextResponse.json(data);
}
