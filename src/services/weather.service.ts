export interface WeatherData {
  readonly temperature: number; // e.g. 22
  readonly description: string; // e.g. "Açık ve Güneşli"
  readonly cityName: string; // e.g. "İstanbul" or restaurant city
  readonly iconType: "sun" | "cloud-sun" | "cloud" | "fog" | "rain" | "snow" | "thunder";
}

interface CacheEntry {
  data: WeatherData;
  timestamp: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const weatherCache = new Map<string, CacheEntry>();

/**
 * WMO Weather Code to Turkish description and icon mapper
 * https://open-meteo.com/en/docs
 */
function parseWmoCode(code: number): {
  description: string;
  iconType: WeatherData["iconType"];
} {
  switch (code) {
    case 0:
      return { description: "Açık ve Güneşli", iconType: "sun" };
    case 1:
      return { description: "Az Bulutlu", iconType: "cloud-sun" };
    case 2:
      return { description: "Parçalı Bulutlu", iconType: "cloud-sun" };
    case 3:
      return { description: "Çok Bulutlu", iconType: "cloud" };
    case 45:
    case 48:
      return { description: "Puslu ve Sisli", iconType: "fog" };
    case 51:
    case 53:
    case 55:
      return { description: "Çisenti Yağmurlu", iconType: "rain" };
    case 61:
    case 63:
    case 65:
      return { description: "Yağmurlu", iconType: "rain" };
    case 80:
    case 81:
    case 82:
      return { description: "Sağanak Yağışlı", iconType: "rain" };
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return { description: "Kar Yağışlı", iconType: "snow" };
    case 95:
    case 96:
    case 99:
      return { description: "Gök Gürültülü Sağanak", iconType: "thunder" };
    default:
      return { description: "Açık", iconType: "sun" };
  }
}

/**
 * Extract clean city or district name from an address string
 */
function extractCityOrDistrict(address?: string | null): string {
  if (!address || typeof address !== "string") return "İstanbul";
  const trimmed = address.trim();
  if (!trimmed) return "İstanbul";

  // If address contains commas, the last or second to last segment is often city/district (e.g. "Moda, Kadıköy, İstanbul")
  const parts = trimmed.split(/[,/\\-]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length > 0) {
    const candidate = parts[parts.length - 1];
    // Remove postal code digits
    const cleaned = candidate.replace(/\d+/g, "").trim();
    if (cleaned.length >= 2) return cleaned;
    if (parts.length > 1) {
      const secondCandidate = parts[parts.length - 2].replace(/\d+/g, "").trim();
      if (secondCandidate.length >= 2) return secondCandidate;
    }
  }

  return trimmed.slice(0, 30);
}

export async function getLiveWeather(
  rawAddress?: string | null,
  rawCity?: string | null,
): Promise<WeatherData> {
  const query = rawCity?.trim() || extractCityOrDistrict(rawAddress);
  const cacheKey = query.toLowerCase();

  // Check cache
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    let lat = 41.01384;
    let lon = 28.94966;
    let resolvedCity = "İstanbul";

    // 1. Geocoding search
    if (query && query.length >= 2) {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        query,
      )}&count=1&language=tr&format=json`;
      const geoRes = await fetch(geoUrl, {
        next: { revalidate: 600 },
        signal: AbortSignal.timeout(4000),
      });

      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.results && geoData.results.length > 0) {
          const first = geoData.results[0];
          lat = first.latitude;
          lon = first.longitude;
          resolvedCity = first.name || query;
        }
      }
    }

    // 2. Forecast search
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
    const forecastRes = await fetch(forecastUrl, {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(4000),
    });

    if (forecastRes.ok) {
      const forecastData = await forecastRes.json();
      const current = forecastData.current;
      const temperature = Math.round(current?.temperature_2m ?? 20);
      const code = current?.weather_code ?? 0;
      const { description, iconType } = parseWmoCode(code);

      const result: WeatherData = {
        temperature,
        description,
        cityName: resolvedCity,
        iconType,
      };

      weatherCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    }
  } catch (error) {
    console.error("Failed to fetch live weather from Open-Meteo:", error);
  }

  // Fallback defaults
  const fallback: WeatherData = {
    temperature: 20,
    description: "Açık ve Güneşli",
    cityName: query || "İstanbul",
    iconType: "sun",
  };
  return fallback;
}
