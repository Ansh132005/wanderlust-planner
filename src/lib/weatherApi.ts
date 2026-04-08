// Open-Meteo API - free, no API key needed
// Step 1: Geocode city name → lat/lon
// Step 2: Fetch current weather

export interface WeatherData {
  city: string;
  country: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
}

interface GeoResult {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

const WEATHER_DESCRIPTIONS: Record<number, { label: string; icon: string }> = {
  0: { label: "Clear sky", icon: "☀️" },
  1: { label: "Mainly clear", icon: "🌤️" },
  2: { label: "Partly cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Foggy", icon: "🌫️" },
  48: { label: "Rime fog", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌦️" },
  53: { label: "Drizzle", icon: "🌦️" },
  55: { label: "Dense drizzle", icon: "🌧️" },
  61: { label: "Slight rain", icon: "🌧️" },
  63: { label: "Moderate rain", icon: "🌧️" },
  65: { label: "Heavy rain", icon: "🌧️" },
  71: { label: "Slight snow", icon: "🌨️" },
  73: { label: "Moderate snow", icon: "🌨️" },
  75: { label: "Heavy snow", icon: "❄️" },
  80: { label: "Rain showers", icon: "🌦️" },
  81: { label: "Moderate showers", icon: "🌧️" },
  82: { label: "Violent showers", icon: "⛈️" },
  95: { label: "Thunderstorm", icon: "⛈️" },
  96: { label: "Thunderstorm + hail", icon: "⛈️" },
  99: { label: "Thunderstorm + heavy hail", icon: "⛈️" },
};

export function getWeatherDescription(code: number) {
  return WEATHER_DESCRIPTIONS[code] ?? { label: "Unknown", icon: "🌡️" };
}

export async function geocodeCity(city: string): Promise<GeoResult | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const r = data.results?.[0];
  if (!r) return null;
  return { name: r.name, country: r.country ?? "", latitude: r.latitude, longitude: r.longitude };
}

export async function fetchWeather(lat: number, lon: number): Promise<Omit<WeatherData, "city" | "country"> | null> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const c = data.current;
  if (!c) return null;
  return {
    temperature: c.temperature_2m,
    feelsLike: c.apparent_temperature,
    humidity: c.relative_humidity_2m,
    windSpeed: c.wind_speed_10m,
    weatherCode: c.weather_code,
    isDay: c.is_day === 1,
  };
}

export async function getWeatherForCity(city: string): Promise<WeatherData | null> {
  const geo = await geocodeCity(city);
  if (!geo) return null;
  const weather = await fetchWeather(geo.latitude, geo.longitude);
  if (!weather) return null;
  return { city: geo.name, country: geo.country, ...weather };
}

// Extract likely city/destination from user messages using simple heuristics
const DESTINATION_PATTERNS = [
  /(?:trip|travel|fly|flight|flights|going|visit|visiting|hotel|hotels|weather|heading)\s+(?:to|in|for|at)\s+([A-Z][a-zA-Z\s]{2,25})/i,
  /(?:from\s+\w+\s+to)\s+([A-Z][a-zA-Z\s]{2,25})/i,
  /(?:weather\s+(?:in|at|for|like\s+in))\s+([A-Z][a-zA-Z\s]{2,25})/i,
  /(?:best\s+(?:time|season)\s+(?:to\s+visit|for))\s+([A-Z][a-zA-Z\s]{2,25})/i,
];

export function extractDestination(text: string): string | null {
  for (const pattern of DESTINATION_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) {
      // Clean trailing common words
      return match[1].replace(/\b(next|this|in|the|for|and|with)\s*$/i, "").trim();
    }
  }
  return null;
}
