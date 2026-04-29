import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/public/weather?lat=XX&lon=YY
 * Proxy to Open-Meteo (free, no API key required).
 * Returns normalized weather condition + temperature.
 * Cached for 30 minutes.
 */

interface WeatherResponse {
  condition: string | null;
  temp: number | null;
  icon: string | null;
  description: string | null;
}

// WMO Weather interpretation codes → our condition system
function wmoToCondition(code: number): { condition: string; description: string } {
  if (code === 0) return { condition: "clear", description: "Cielo despejado" };
  if (code <= 3) return { condition: "clouds", description: "Parcialmente nublado" };
  if (code <= 49) return { condition: "mist", description: "Neblina" };
  if (code <= 59) return { condition: "drizzle", description: "Llovizna" };
  if (code <= 69) return { condition: "rain", description: "Lluvia" };
  if (code <= 79) return { condition: "snow", description: "Nieve" };
  if (code <= 84) return { condition: "rain", description: "Lluvia intensa" };
  if (code <= 86) return { condition: "snow", description: "Nevada intensa" };
  if (code <= 99) return { condition: "thunderstorm", description: "Tormenta eléctrica" };
  return { condition: "clear", description: "Despejado" };
}

export async function GET(req: NextRequest) {
  try {
    const lat = req.nextUrl.searchParams.get("lat");
    const lon = req.nextUrl.searchParams.get("lon");

    if (!lat || !lon) {
      return NextResponse.json(
        { condition: null, temp: null, icon: null, description: null } as WeatherResponse
      );
    }

    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`,
      { signal: AbortSignal.timeout(3000), cache: "no-store" }
    );

    if (!res.ok) {
      return NextResponse.json(
        { condition: "clear", temp: 22, icon: null, description: null } as WeatherResponse,
        { headers: { "Cache-Control": "public, max-age=1800" } }
      );
    }

    const data = await res.json();
    const weatherCode = data.current?.weather_code ?? 0;
    const { condition, description } = wmoToCondition(weatherCode);
    const temp = Math.round(data.current?.temperature_2m ?? 22);

    const result: WeatherResponse = {
      condition,
      temp,
      icon: null, // Open-Meteo doesn't use icon codes
      description,
    };

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=1800" }, // 30 min cache
    });
  } catch (error) {
    console.error("GET /api/public/weather error:", error);
    return NextResponse.json(
      { condition: "clear", temp: 22, icon: null, description: null } as WeatherResponse,
      { status: 200 } // Always return 200, weather is non-critical
    );
  }
}

