

export interface GeoResult {
  country: string | null;
  countryName: string | null;
  city: string | null;
  lat: number | null;
  lon: number | null;
}

// ISO 3166-1 alpha-2 country code to name mapping (most common)
const COUNTRY_NAMES: Record<string, string> = {
  AR: "Argentina", US: "United States", MX: "Mexico", CL: "Chile",
  CO: "Colombia", BR: "Brazil", ES: "Spain", PE: "Peru", EC: "Ecuador",
  UY: "Uruguay", PY: "Paraguay", VE: "Venezuela", BO: "Bolivia",
  CR: "Costa Rica", PA: "Panama", DO: "Dominican Republic", GT: "Guatemala",
  HN: "Honduras", SV: "El Salvador", NI: "Nicaragua", CU: "Cuba",
  GB: "United Kingdom", FR: "France", DE: "Germany", IT: "Italy",
  PT: "Portugal", NL: "Netherlands", BE: "Belgium", CH: "Switzerland",
  AT: "Austria", SE: "Sweden", NO: "Norway", DK: "Denmark", FI: "Finland",
  IE: "Ireland", PL: "Poland", CZ: "Czech Republic", RO: "Romania",
  CA: "Canada", AU: "Australia", NZ: "New Zealand", JP: "Japan",
  KR: "South Korea", CN: "China", IN: "India", IL: "Israel",
  AE: "UAE", SA: "Saudi Arabia", ZA: "South Africa", NG: "Nigeria",
  EG: "Egypt", KE: "Kenya", RU: "Russia", UA: "Ukraine", TR: "Turkey",
};

let geoipInst: any = null;

/**
 * Lookup country/city from an IP address using the local geoip-lite database.
 * Returns nulls for private/localhost IPs — never throws.
 */
export async function getGeo(ip: string | null): Promise<GeoResult> {
  try {
    // For local/private IPs, resolve the real public IP
    let resolvedIp = ip;
    if (!ip || isLocalIp(ip)) {
      resolvedIp = await getPublicIp();
    }
    
    if (!resolvedIp) return { country: null, countryName: null, city: null, lat: null, lon: null };

    // Fetch from a free public API (no key required for reasonable use)
    const res = await fetch(`http://ip-api.com/json/${resolvedIp}`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = await res.json();

    if (data.status === "success") {
      return {
        country: data.countryCode || null,
        countryName: data.country || null,
        city: data.city || null,
        lat: data.lat ?? null,
        lon: data.lon ?? null,
      };
    }

    return { country: null, countryName: null, city: null, lat: null, lon: null };
  } catch (err) {
    console.error("[GEO] Error in getGeo:", err);
    return { country: null, countryName: null, city: null, lat: null, lon: null };
  }
}

/** Returns true for localhost, loopback, and private RFC-1918 IPs */
function isLocalIp(ip: string): boolean {
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "::ffff:127.0.0.1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.2") ||
    ip.startsWith("172.3")
  );
}

/** Cache the public IP so we only fetch once */
let cachedPublicIp: string | null = null;

async function getPublicIp(): Promise<string | null> {
  if (cachedPublicIp) return cachedPublicIp;
  try {
    const res = await fetch("https://api.ipify.org?format=text", {
      signal: AbortSignal.timeout(3000),
    });
    cachedPublicIp = (await res.text()).trim();
    return cachedPublicIp;
  } catch {
    return null;
  }
}
