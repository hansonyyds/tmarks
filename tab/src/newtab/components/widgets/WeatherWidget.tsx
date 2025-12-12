/**
 * 天气组件 - 显示当前天气和未来预报
 */

import { useState, useEffect, memo } from 'react';
import { Cloud, CloudRain, CloudSnow, Sun, Wind, Droplets, Eye, X, MapPin, RefreshCw } from 'lucide-react';
import type { WidgetRendererProps } from './types';
import { getSizeSpan } from './widgetRegistry';

const CACHE_KEY = 'newtab_weather';
const CACHE_DURATION = 30 * 60 * 1000; // 30 分钟

// 天气数据接口
interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  updateTime: number;
  forecast?: ForecastDay[];
}

interface ForecastDay {
  date: string;
  tempMax: number;
  tempMin: number;
  condition: string;
  icon: string;
}

// 天气图标映射
const WEATHER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  snowy: CloudSnow,
  windy: Wind,
};

function getWeatherIcon(condition: string) {
  const lowerCondition = condition.toLowerCase();
  if (lowerCondition.includes('sun') || lowerCondition.includes('clear') || lowerCondition.includes('晴')) {
    return WEATHER_ICONS.sunny;
  }
  if (lowerCondition.includes('rain') || lowerCondition.includes('雨')) {
    return WEATHER_ICONS.rainy;
  }
  if (lowerCondition.includes('snow') || lowerCondition.includes('雪')) {
    return WEATHER_ICONS.snowy;
  }
  if (lowerCondition.includes('wind') || lowerCondition.includes('风')) {
    return WEATHER_ICONS.windy;
  }
  return WEATHER_ICONS.cloudy;
}

export const WeatherWidget = memo(function WeatherWidget({
  item,
  onUpdate,
  onRemove,
  isEditing,
}: WidgetRendererProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCityInput, setShowCityInput] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const { rows } = getSizeSpan(item.size);

  const city = item.config?.weather?.city || '北京';
  const unit = item.config?.weather?.unit || 'C';
  const showForecast = rows >= 2;

  // 获取天气数据
  const fetchWeather = async (cityName: string, forceRefresh = false) => {
    // 检查缓存
    if (!forceRefresh) {
      try {
        const result = await chrome.storage.local.get(CACHE_KEY);
        const cache = result[CACHE_KEY] as { city: string; data: WeatherData } | undefined;
        if (cache && cache.city === cityName && Date.now() - cache.data.updateTime < CACHE_DURATION) {
          setWeather(cache.data);
          return;
        }
      } catch {}
    }

    setLoading(true);
    setError(null);

    try {
      // 使用和风天气 API（需要替换为实际的 API Key）
      // 这里使用免费的天气 API 示例
      const response = await fetch(
        `https://api.vvhan.com/api/weather?city=${encodeURIComponent(cityName)}`
      );
      
      if (!response.ok) {
        throw new Error('获取天气失败');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || '获取天气失败');
      }

      const weatherData: WeatherData = {
        city: data.data.city || cityName,
        temp: parseInt(data.data.tem) || 0,
        condition: data.data.wea || '未知',
        icon: data.data.wea_img || 'cloudy',
        humidity: parseInt(data.data.humidity) || 0,
        windSpeed: parseInt(data.data.win_speed) || 0,
        visibility: 10,
        updateTime: Date.now(),
        forecast: showForecast && data.data.forecast ? data.data.forecast.slice(0, 3).map((day: any) => ({
          date: day.date,
          tempMax: parseInt(day.tem_day) || 0,
          tempMin: parseInt(day.tem_night) || 0,
          condition: day.wea || '未知',
          icon: day.wea_img || 'cloudy',
        })) : undefined,
      };

      setWeather(weatherData);
      
      // 缓存数据
      chrome.storage.local.set({
        [CACHE_KEY]: { city: cityName, data: weatherData },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取天气失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(city);
  }, [city]);

  const handleCityChange = () => {
    if (cityInput.trim() && onUpdate) {
      onUpdate(item.id, {
        config: {
          ...item.config,
          weather: { ...item.config?.weather, city: cityInput.trim() },
        },
      });
      setShowCityInput(false);
      setCityInput('');
    }
  };

  const WeatherIcon = weather ? getWeatherIcon(weather.condition) : Cloud;

  return (
    <div className="group relative h-full p-3 rounded-xl glass-card flex flex-col">
      {isEditing && onRemove && (
        <button
          onClick={() => onRemove(item.id)}
          className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 text-white 
                     opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setShowCityInput(!showCityInput)}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <MapPin className="w-4 h-4" />
          <span className="text-sm font-medium">{weather?.city || city}</span>
        </button>
        <button
          onClick={() => fetchWeather(city, true)}
          disabled={loading}
          className="p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 text-white/50 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 城市输入 */}
      {showCityInput && (
        <div className="mb-2">
          <input
            type="text"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCityChange()}
            placeholder="输入城市名称"
            className="w-full bg-white/10 text-white text-xs rounded px-2 py-1 outline-none border border-white/20 focus:border-blue-500/50"
            autoFocus
          />
        </div>
      )}

      {/* 天气内容 */}
      {loading && !weather ? (
        <div className="flex-1 flex items-center justify-center text-white/40 text-sm">
          加载中...
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-red-400 text-sm">
          {error}
        </div>
      ) : weather ? (
        <div className="flex-1 flex flex-col">
          {/* 当前天气 */}
          <div className="flex items-center gap-3 mb-3">
            <WeatherIcon className="w-12 h-12 text-yellow-400" />
            <div>
              <div className="text-3xl font-bold text-white">
                {weather.temp}°{unit}
              </div>
              <div className="text-sm text-white/60">{weather.condition}</div>
            </div>
          </div>

          {/* 详细信息 */}
          <div className="grid grid-cols-3 gap-2 text-xs text-white/60 mb-3">
            <div className="flex items-center gap-1">
              <Droplets className="w-3 h-3" />
              <span>{weather.humidity}%</span>
            </div>
            <div className="flex items-center gap-1">
              <Wind className="w-3 h-3" />
              <span>{weather.windSpeed}km/h</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{weather.visibility}km</span>
            </div>
          </div>

          {/* 未来预报 */}
          {showForecast && weather.forecast && weather.forecast.length > 0 && (
            <div className="flex-1 border-t border-white/10 pt-2">
              <div className="text-xs text-white/60 mb-2">未来预报</div>
              <div className="space-y-1">
                {weather.forecast.map((day, index) => {
                  const DayIcon = getWeatherIcon(day.condition);
                  return (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="text-white/60">{day.date}</span>
                      <div className="flex items-center gap-2">
                        <DayIcon className="w-3 h-3 text-white/60" />
                        <span className="text-white/80">
                          {day.tempMax}° / {day.tempMin}°
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
});
