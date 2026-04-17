import { db } from "@/lib/db";
import { pageViews, linkClicks, links } from "@/lib/db/schema";
import { sql, eq, and, gte, lte, count, countDistinct, desc } from "drizzle-orm";

export interface DateRange {
  from: Date;
  to: Date;
  profileId: string;
  location?: string | null;
  source?: string | null;
  device?: string | null;
}

function buildFilterConditions(table: any, filters: { location?: string | null; source?: string | null; device?: string | null }) {
  const conditions = [];
  
  if (filters.location) {
    conditions.push(eq(table.country, filters.location));
  }
  
  if (filters.device) {
    conditions.push(eq(table.device, filters.device));
  }
  
  if (filters.source) {
    const s = filters.source.toLowerCase();
    if (s === "direct") {
      conditions.push(sql`(${table.referrer} IS NULL OR ${table.referrer} = '')`);
    } else if (s === "twitter") {
      conditions.push(sql`(${table.referrer} ILIKE ${'%twitter%'} OR ${table.referrer} ILIKE ${'%x.com%'})`);
    } else {
      conditions.push(sql`${table.referrer} ILIKE ${`%${s}%`}`);
    }
  }
  
  return conditions;
}

export async function getSummary({ from, to, profileId, location, source, device }: DateRange) {
  // Current period
  const [visitResult] = await db
    .select({
      total: count(),
      unique: countDistinct(pageViews.sessionId),
    })
    .from(pageViews)
    .where(
      and(
        eq(pageViews.profileId, profileId),
        gte(pageViews.timestamp, from),
        lte(pageViews.timestamp, to),
        ...buildFilterConditions(pageViews, { location, source, device })
      )
    );

  const [clickResult] = await db
    .select({ total: count() })
    .from(linkClicks)
    .where(
      and(
        eq(linkClicks.profileId, profileId),
        gte(linkClicks.timestamp, from),
        lte(linkClicks.timestamp, to),
        ...buildFilterConditions(linkClicks, { location, source, device })
      )
    );

  const totalVisits = Number(visitResult?.total) || 0;
  const uniqueVisitors = Number(visitResult?.unique) || 0;
  const totalClicks = Number(clickResult?.total) || 0;
  const ctr = totalVisits > 0 ? (totalClicks / totalVisits) * 100 : 0;

  // Previous period (same duration, shifted back)
  const duration = to.getTime() - from.getTime();
  const prevFrom = new Date(from.getTime() - duration);
  const prevTo = new Date(from.getTime());

  const [prevVisits] = await db
    .select({ total: count() })
    .from(pageViews)
    .where(
      and(
        eq(pageViews.profileId, profileId),
        gte(pageViews.timestamp, prevFrom),
        lte(pageViews.timestamp, prevTo),
        ...buildFilterConditions(pageViews, { location, source, device })
      )
    );

  const [prevClicks] = await db
    .select({ total: count() })
    .from(linkClicks)
    .where(
      and(
        eq(linkClicks.profileId, profileId),
        gte(linkClicks.timestamp, prevFrom),
        lte(linkClicks.timestamp, prevTo),
        ...buildFilterConditions(linkClicks, { location, source, device })
      )
    );

  const prevVisitCount = Number(prevVisits?.total) || 0;
  const prevClickCount = Number(prevClicks?.total) || 0;

  const deltaVisits = prevVisitCount > 0
    ? ((totalVisits - prevVisitCount) / prevVisitCount) * 100
    : 0;
  const deltaClicks = prevClickCount > 0
    ? ((totalClicks - prevClickCount) / prevClickCount) * 100
    : 0;

  // Top country
  const topCountryResult = await db
    .select({
      country: pageViews.country,
      countryName: pageViews.countryName,
      visits: count(),
    })
    .from(pageViews)
    .where(
      and(
        eq(pageViews.profileId, profileId),
        gte(pageViews.timestamp, from),
        lte(pageViews.timestamp, to),
        sql`${pageViews.country} IS NOT NULL`,
        ...buildFilterConditions(pageViews, { location, source, device })
      )
    )
    .groupBy(pageViews.country, pageViews.countryName)
    .orderBy(desc(count()))
    .limit(1);

  // Top link
  const topLinkResult = await db
    .select({
      title: links.title,
      clicks: count(),
    })
    .from(linkClicks)
    .innerJoin(links, eq(linkClicks.linkId, links.id))
    .where(
      and(
        eq(linkClicks.profileId, profileId),
        gte(linkClicks.timestamp, from),
        lte(linkClicks.timestamp, to),
        ...buildFilterConditions(linkClicks, { location, source, device })
      )
    )
    .groupBy(links.title)
    .orderBy(desc(count()))
    .limit(1);

  return {
    totalVisits,
    uniqueVisitors,
    totalClicks,
    ctr: Math.round(ctr * 10) / 10,
    topCountry: topCountryResult[0]?.countryName || "N/A",
    topLink: topLinkResult[0]
      ? { title: topLinkResult[0].title, clicks: topLinkResult[0].clicks }
      : null,
    deltaVisits: Math.round(deltaVisits * 10) / 10,
    deltaClicks: Math.round(deltaClicks * 10) / 10,
  };
}

export async function getTimeseries({ from, to, profileId, location, source, device }: DateRange) {
  const visits = await db
    .select({
      date: sql<string>`DATE(${pageViews.timestamp})`.as("date"),
      count: count(),
    })
    .from(pageViews)
    .where(
      and(
        eq(pageViews.profileId, profileId),
        gte(pageViews.timestamp, from),
        lte(pageViews.timestamp, to),
        ...buildFilterConditions(pageViews, { location, source, device })
      )
    )
    .groupBy(sql`DATE(${pageViews.timestamp})`)
    .orderBy(sql`DATE(${pageViews.timestamp})`);

  const clicks = await db
    .select({
      date: sql<string>`DATE(${linkClicks.timestamp})`.as("date"),
      count: count(),
    })
    .from(linkClicks)
    .where(
      and(
        eq(linkClicks.profileId, profileId),
        gte(linkClicks.timestamp, from),
        lte(linkClicks.timestamp, to),
        ...buildFilterConditions(linkClicks, { location, source, device })
      )
    )
    .groupBy(sql`DATE(${linkClicks.timestamp})`)
    .orderBy(sql`DATE(${linkClicks.timestamp})`);

  // Merge into unified timeline
  const visitMap = new Map(visits.map((v) => [v.date, v.count]));
  const clickMap = new Map(clicks.map((c) => [c.date, c.count]));
  const allDates = new Set([...visitMap.keys(), ...clickMap.keys()]);

  // Fill in missing dates
  const current = new Date(from);
  while (current <= to) {
    const dateStr = current.toISOString().split("T")[0];
    allDates.add(dateStr);
    current.setDate(current.getDate() + 1);
  }

  return Array.from(allDates)
    .sort()
    .map((date) => ({
      date,
      visits: visitMap.get(date) || 0,
      clicks: clickMap.get(date) || 0,
    }));
}

export async function getTimeseriesHourly({ from, to, profileId, location, source, device }: DateRange) {
  // The client sends the timezone offset so we can group by local hour
  const visits = await db
    .select({
      hour: sql<string>`to_char(${pageViews.timestamp}, 'YYYY-MM-DD HH24:00')`.as("hour"),
      count: count(),
    })
    .from(pageViews)
    .where(
      and(
        eq(pageViews.profileId, profileId),
        gte(pageViews.timestamp, from),
        lte(pageViews.timestamp, to),
        ...buildFilterConditions(pageViews, { location, source, device })
      )
    )
    .groupBy(sql`to_char(${pageViews.timestamp}, 'YYYY-MM-DD HH24:00')`)
    .orderBy(sql`to_char(${pageViews.timestamp}, 'YYYY-MM-DD HH24:00')`);

  const clicks = await db
    .select({
      hour: sql<string>`to_char(${linkClicks.timestamp}, 'YYYY-MM-DD HH24:00')`.as("hour"),
      count: count(),
    })
    .from(linkClicks)
    .where(
      and(
        eq(linkClicks.profileId, profileId),
        gte(linkClicks.timestamp, from),
        lte(linkClicks.timestamp, to),
        ...buildFilterConditions(linkClicks, { location, source, device })
      )
    )
    .groupBy(sql`to_char(${linkClicks.timestamp}, 'YYYY-MM-DD HH24:00')`)
    .orderBy(sql`to_char(${linkClicks.timestamp}, 'YYYY-MM-DD HH24:00')`);

  const visitMap = new Map(visits.map((v) => [v.hour, v.count]));
  const clickMap = new Map(clicks.map((c) => [c.hour, c.count]));
  const allHours = new Set([...visitMap.keys(), ...clickMap.keys()]);

  // Fill in all hours between from and to
  const current = new Date(from);
  current.setMinutes(0, 0, 0);
  while (current <= to) {
    const y = current.getUTCFullYear();
    const m = String(current.getUTCMonth() + 1).padStart(2, "0");
    const d = String(current.getUTCDate()).padStart(2, "0");
    const h = String(current.getUTCHours()).padStart(2, "0");
    allHours.add(`${y}-${m}-${d} ${h}:00`);
    current.setTime(current.getTime() + 60 * 60 * 1000);
  }

  return Array.from(allHours)
    .sort()
    .map((hour) => ({
      date: hour,
      visits: visitMap.get(hour) || 0,
      clicks: clickMap.get(hour) || 0,
    }));
}

export async function getCountries({ from, to, profileId, location, source, device }: DateRange) {
  const result = await db
    .select({
      country: pageViews.country,
      countryName: pageViews.countryName,
      visits: count(),
    })
    .from(pageViews)
    .where(
      and(
        eq(pageViews.profileId, profileId),
        gte(pageViews.timestamp, from),
        lte(pageViews.timestamp, to),
        sql`${pageViews.country} IS NOT NULL`,
        ...buildFilterConditions(pageViews, { location, source, device })
      )
    )
    .groupBy(pageViews.country, pageViews.countryName)
    .orderBy(desc(count()));

  const total = result.reduce((sum, r) => sum + r.visits, 0);

  return result.map((r) => ({
    country: r.country || "Unknown",
    countryName: r.countryName || "Unknown",
    visits: r.visits,
    percentage: total > 0 ? Math.round((r.visits / total) * 1000) / 10 : 0,
  }));
}

export async function getLinkStats({ from, to, profileId, location, source, device }: DateRange) {
  const result = await db
    .select({
      linkId: linkClicks.linkId,
      url: linkClicks.url,
      itemTitle: linkClicks.itemTitle,
      blockType: linkClicks.blockType,
      title: links.title,
      type: links.type,
      clicks: count(),
    })
    .from(linkClicks)
    .leftJoin(links, eq(linkClicks.linkId, links.id))
    .where(
      and(
        eq(linkClicks.profileId, profileId),
        gte(linkClicks.timestamp, from),
        lte(linkClicks.timestamp, to),
        ...buildFilterConditions(linkClicks, { location, source, device })
      )
    )
    .groupBy(linkClicks.linkId, linkClicks.url, linkClicks.itemTitle, linkClicks.blockType, links.title, links.type)
    .orderBy(desc(count()));

  const total = result.reduce((sum, r) => sum + Number(r.clicks), 0);

  // Get total visits for CTR calculation
  const [visitResult] = await db
    .select({ total: count() })
    .from(pageViews)
    .where(
      and(
        eq(pageViews.profileId, profileId),
        gte(pageViews.timestamp, from),
        lte(pageViews.timestamp, to),
        ...buildFilterConditions(pageViews, { location, source, device })
      )
    );

  const totalVisits = Number(visitResult?.total) || 0;

  return result.map((r) => {
    const clicks = Number(r.clicks) || 0;
    return {
      linkId: r.linkId || r.url || `custom-${r.itemTitle || ''}`,
      title: r.title || r.itemTitle || r.url || 'Unknown',
      type: r.type || r.blockType || 'custom',
      clicks,
      percentage: total > 0 ? Math.round((clicks / total) * 1000) / 10 : 0,
      ctr: totalVisits > 0 ? Math.round((clicks / totalVisits) * 1000) / 10 : 0,
    };
  });
}

export async function getDevices({ from, to, profileId, location, source, device }: DateRange) {
  const devices = await db
    .select({
      device: pageViews.device,
      count: count(),
    })
    .from(pageViews)
    .where(
      and(
        eq(pageViews.profileId, profileId),
        gte(pageViews.timestamp, from),
        lte(pageViews.timestamp, to),
        ...buildFilterConditions(pageViews, { location, source, device })
      )
    )
    .groupBy(pageViews.device)
    .orderBy(desc(count()));

  const deviceClicks = await db
    .select({
      device: linkClicks.device,
      clicks: count(),
    })
    .from(linkClicks)
    .where(
      and(
        eq(linkClicks.profileId, profileId),
        gte(linkClicks.timestamp, from),
        lte(linkClicks.timestamp, to),
        ...buildFilterConditions(linkClicks, { location, source, device })
      )
    )
    .groupBy(linkClicks.device);

  const deviceClickMap = new Map(deviceClicks.map(c => [c.device, c.clicks]));

  const devicesWithClicks = devices.map(d => ({
    ...d,
    clicks: deviceClickMap.get(d.device) || 0
  }));

  const browsers = await db
    .select({
      browser: pageViews.browser,
      count: count(),
    })
    .from(pageViews)
    .where(
      and(
        eq(pageViews.profileId, profileId),
        gte(pageViews.timestamp, from),
        lte(pageViews.timestamp, to),
        ...buildFilterConditions(pageViews, { location, source, device })
      )
    )
    .groupBy(pageViews.browser)
    .orderBy(desc(count()))
    .limit(8);

  const osStats = await db
    .select({
      os: pageViews.os,
      count: count(),
    })
    .from(pageViews)
    .where(
      and(
        eq(pageViews.profileId, profileId),
        gte(pageViews.timestamp, from),
        lte(pageViews.timestamp, to),
        ...buildFilterConditions(pageViews, { location, source, device })
      )
    )
    .groupBy(pageViews.os)
    .orderBy(desc(count()))
    .limit(8);

  return { devices: devicesWithClicks, browsers, os: osStats };
}

export async function getSources({ from, to, profileId, location, source, device }: DateRange) {
  const result = await db
    .select({
      referrer: pageViews.referrer,
      visits: count(),
    })
    .from(pageViews)
    .where(
      and(
        eq(pageViews.profileId, profileId),
        gte(pageViews.timestamp, from),
        lte(pageViews.timestamp, to),
        sql`${pageViews.referrer} IS NOT NULL AND ${pageViews.referrer} != ''`,
        ...buildFilterConditions(pageViews, { location, source, device })
      )
    )
    .groupBy(pageViews.referrer)
    .orderBy(desc(count()));

  // Get clicks per referrer from linkClicks
  const clicksByRef = await db
    .select({
      referrer: linkClicks.referrer,
      clicks: count(),
    })
    .from(linkClicks)
    .where(
      and(
        eq(linkClicks.profileId, profileId),
        gte(linkClicks.timestamp, from),
        lte(linkClicks.timestamp, to),
        sql`${linkClicks.referrer} IS NOT NULL AND ${linkClicks.referrer} != ''`,
        ...buildFilterConditions(linkClicks, { location, source, device })
      )
    )
    .groupBy(linkClicks.referrer)
    .orderBy(desc(count()));

  const clickMap = new Map(clicksByRef.map((c) => [c.referrer, c.clicks]));
  const totalVisits = result.reduce((sum, r) => sum + r.visits, 0);

  // Normalize referrer domains
  const sourceMap = new Map<string, { visits: number; clicks: number }>();
  for (const r of result) {
    let source = "Direct";
    try {
      const url = new URL(r.referrer || "");
      source = url.hostname.replace("www.", "");
    } catch {
      source = r.referrer || "Direct";
    }
    // Prettify common sources
    if (source.includes("instagram")) source = "Instagram";
    else if (source.includes("tiktok")) source = "TikTok";
    else if (source.includes("youtube")) source = "YouTube";
    else if (source.includes("twitter") || source.includes("x.com")) source = "Twitter";
    else if (source.includes("facebook")) source = "Facebook";
    else if (source.includes("linkedin")) source = "LinkedIn";
    else if (source.includes("google")) source = "Google";
    else if (source.includes("whatsapp")) source = "WhatsApp";

    const existing = sourceMap.get(source) || { visits: 0, clicks: 0 };
    existing.visits += r.visits;
    existing.clicks += clickMap.get(r.referrer) || 0;
    sourceMap.set(source, existing);
  }

  return Array.from(sourceMap.entries())
    .map(([source, data]) => ({
      source,
      visits: data.visits,
      clicks: data.clicks,
      percentage: totalVisits > 0 ? Math.round((data.visits / totalVisits) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.visits - a.visits);
}
