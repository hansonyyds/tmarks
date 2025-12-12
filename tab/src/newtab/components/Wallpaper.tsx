/**
 * 壁纸背景组件
 */

import { useState, useEffect } from 'react';
import type { WallpaperConfig } from '../types';
import { BING_WALLPAPER_API, UNSPLASH_API } from '../constants';

interface WallpaperProps {
  config: WallpaperConfig;
}

const WALLPAPER_CACHE_KEY = 'newtab_wallpaper_cache';

export function Wallpaper({ config }: WallpaperProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (config.type === 'bing') {
      fetchBingWallpaper();
    } else if (config.type === 'unsplash') {
      fetchUnsplashWallpaper();
    } else if (config.type === 'image') {
      setImageUrl(config.value);
    }
  }, [config.type, config.value]);

  const fetchBingWallpaper = async () => {
    try {
      // 检查缓存
      const cached = await getCachedWallpaper('bing');
      if (cached) {
        setImageUrl(cached);
        return;
      }

      const res = await fetch(BING_WALLPAPER_API);
      const data = await res.json();
      if (data.images?.[0]?.url) {
        const url = `https://www.bing.com${data.images[0].url}`;
        setImageUrl(url);
        cacheWallpaper('bing', url);
      }
    } catch (error) {
      console.error('Failed to fetch Bing wallpaper:', error);
    }
  };

  const fetchUnsplashWallpaper = async () => {
    try {
      // 检查缓存（每小时更新一次）
      const cached = await getCachedWallpaper('unsplash');
      if (cached) {
        setImageUrl(cached);
        return;
      }

      // 使用 picsum.photos 作为免费替代
      const url = `${UNSPLASH_API}?random=${Date.now()}`;
      setImageUrl(url);
      cacheWallpaper('unsplash', url);
    } catch (error) {
      console.error('Failed to fetch Unsplash wallpaper:', error);
    }
  };

  const getCachedWallpaper = async (type: string): Promise<string | null> => {
    try {
      const result = await chrome.storage.local.get(WALLPAPER_CACHE_KEY);
      const cache = result[WALLPAPER_CACHE_KEY] as { type: string; url: string; timestamp: number } | undefined;
      if (cache && cache.type === type) {
        const cacheAge = Date.now() - cache.timestamp;
        const maxAge = type === 'bing' ? 6 * 60 * 60 * 1000 : 60 * 60 * 1000; // bing 6小时, unsplash 1小时
        if (cacheAge < maxAge) {
          return cache.url;
        }
      }
    } catch {}
    return null;
  };

  const cacheWallpaper = (type: string, url: string) => {
    chrome.storage.local.set({
      [WALLPAPER_CACHE_KEY]: { type, url, timestamp: Date.now() },
    });
  };

  const style: React.CSSProperties = {
    filter: `blur(${config.blur}px) brightness(${config.brightness}%)`,
  };

  if (config.type === 'color') {
    return (
      <div
        className="absolute inset-0 z-0"
        style={{ ...style, backgroundColor: config.value }}
      />
    );
  }

  const url = config.type === 'bing' || config.type === 'unsplash' ? imageUrl : config.value;

  if (!url) {
    return <div className="absolute inset-0 z-0 bg-[#1a1a2e]" />;
  }

  return (
    <div
      className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
      style={{ ...style, backgroundImage: `url(${url})` }}
    />
  );
}
