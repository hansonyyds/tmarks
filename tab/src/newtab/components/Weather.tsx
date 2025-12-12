/**
 * 天气组件 - 使用 wttr.in 免费 API
 */

import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, RefreshCw } from 'lucide-react';
import type { WeatherData } from '../types';

const WEATHER_CACHE_KEY = 'newtab_weather';
const CACHE_DURATION = 30 * 60 * 1000; // 30 分钟

// 天气图标映射
const weatherIcons: Record<string, React.ReactNode> = {
  sunny: <Sun className="w-6 h-6" />,
  clear: <Sun className="w-6 h-6" />,
  cloudy: <Cloud className="w-6 h-6" />,
  overcast: <Cloud className="w-6 h-6" />,
  rain: <CloudRain className="w-6 h-6" />,
  snow: <CloudSnow className="w-6 h-6" />,
  thunder: <CloudLightning className="w-6 h-6" />,
  wind: <Wind className="w-6 h-6" />,
};

function getWeatherIcon(condition: string) {
  const lower = condition.toLowerCase();
  if (lower.includes('sun') || lower.includes('clear')) return weatherIcons.sunny;
  if (lower.includes('rain') || lower.includes('drizzle')) return weatherIcons.rain;
  if (lower.includes('snow')) return weatherIcons.snow;
  if (lower.includes('thunder') || lower.includes('storm')) return weatherIcons.thunder;
  if (lower.includes('wind')) return weatherIcons.wind;
  return weatherIcons.cloudy;
}

export function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async (force = false) => {
    // 检查缓存
    if (!force) {
      try {
        const cached = await chrome.storage.local.get(WEATHER_CACHE_KEY);
        const data = cached[WEATHER_CACHE_KEY] as WeatherData | undefined;
        if (data && Date.now() - data.updatedAt < CACHE_DURATION) {
          setWeather(data);
          return;
        }
      } catch {}
    }

    setLoading(true);
    setError(null);

    try {
      // 使用 wttr.in 免费 API
      const res = await fetch('https://wttr.in/?format=j1');
      const data = await res.json();

      const current = data.current_condition[0];
      const location = data.nearest_area[0];

      const weatherData: WeatherData = {
        temp: parseInt(current.temp_C),
        condition: current.weatherDesc[0].value,
        icon: current.weatherCode,
        city: location.areaName[0].value,
        updatedAt: Date.now(),
      };

      setWeather(weatherData);
      chrome.storage.local.set({ [WEATHER_CACHE_KEY]: weatherData });
    } catch (err) {
      setError('获取天气失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  if (error) {
    return (
      <div className="flex items-center gap-2 text-white/50 text-sm">
        <Cloud className="w-5 h-5" />
        <span>{error}</span>
      </div>
    );
  }

  if (!weather && !loading) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 text-white select-none">
      {loading ? (
        <RefreshCw className="w-5 h-5 animate-spin text-white/50" />
      ) : (
        <>
          <div className="text-white/80">{getWeatherIcon(weather?.condition || '')}</div>
          <div className="flex flex-col">
            <span className="text-lg font-light">{weather?.temp}°C</span>
            <span className="text-xs text-white/60">{weather?.city}</span>
          </div>
          <button
            onClick={() => fetchWeather(true)}
            className="p-1 rounded-full hover:bg-white/10 transition-colors ml-1"
            title="刷新天气"
          >
            <RefreshCw className="w-3 h-3 text-white/40" />
          </button>
        </>
      )}
    </div>
  );
}
