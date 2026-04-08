import { useEffect, useState } from "react";
import { Cloud, Droplets, Wind, Thermometer } from "lucide-react";
import { getWeatherForCity, getWeatherDescription, type WeatherData } from "@/lib/weatherApi";

interface WeatherWidgetProps {
  destination: string;
}

const WeatherWidget = ({ destination }: WeatherWidgetProps) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    getWeatherForCity(destination)
      .then((data) => {
        if (cancelled) return;
        if (data) setWeather(data);
        else setError(true);
      })
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [destination]);

  if (error) return null;

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-muted rounded w-32 mb-3" />
        <div className="h-8 bg-muted rounded w-20" />
      </div>
    );
  }

  if (!weather) return null;

  const desc = getWeatherDescription(weather.weatherCode);

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Cloud className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Current Weather
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {weather.city}, {weather.country}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-4xl">{desc.icon}</div>
        <div>
          <div className="text-2xl font-bold text-foreground">
            {Math.round(weather.temperature)}°C
          </div>
          <div className="text-sm text-muted-foreground">{desc.label}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5">
          <Thermometer className="w-3.5 h-3.5 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Feels like</div>
            <div className="text-sm font-medium text-foreground">{Math.round(weather.feelsLike)}°C</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Droplets className="w-3.5 h-3.5 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Humidity</div>
            <div className="text-sm font-medium text-foreground">{weather.humidity}%</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Wind className="w-3.5 h-3.5 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Wind</div>
            <div className="text-sm font-medium text-foreground">{Math.round(weather.windSpeed)} km/h</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
