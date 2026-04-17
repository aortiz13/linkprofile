import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getTimeseries, getTimeseriesHourly } from "@/lib/analytics-queries";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from")
    ? new Date(searchParams.get("from")!)
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date();
  const location = searchParams.get("location");
  const source = searchParams.get("source");
  const device = searchParams.get("device");
  const granularity = searchParams.get("granularity"); // "hourly" | null
  const timezone = searchParams.get("timezone"); // e.g. "America/Argentina/Buenos_Aires"

  const params = { from, to, profileId: user.profileId, location, source, device, timezone };

  const data = granularity === "hourly"
    ? await getTimeseriesHourly(params)
    : await getTimeseries(params);

  return NextResponse.json(data);
}
