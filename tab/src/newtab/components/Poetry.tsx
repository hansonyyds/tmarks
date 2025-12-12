/**
 * 每日诗词组件
 */

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { DEFAULT_POETRY } from '../constants';
import type { Poetry as PoetryType } from '../types';

const POETRY_CACHE_KEY = 'newtab_poetry';

export function Poetry() {
  const [poetry, setPoetry] = useState<PoetryType | null>(null);

  const getRandomPoetry = () => {
    const index = Math.floor(Math.random() * DEFAULT_POETRY.length);
    const newPoetry = DEFAULT_POETRY[index];
    setPoetry(newPoetry);
    
    // 缓存今日诗词
    const today = new Date().toDateString();
    chrome.storage.local.set({
      [POETRY_CACHE_KEY]: { poetry: newPoetry, date: today },
    });
  };

  useEffect(() => {
    // 检查今日是否已有诗词
    chrome.storage.local.get(POETRY_CACHE_KEY).then((result) => {
      const data = result[POETRY_CACHE_KEY] as { poetry: PoetryType; date: string } | undefined;
      const today = new Date().toDateString();
      
      if (data && data.date === today) {
        setPoetry(data.poetry);
      } else {
        getRandomPoetry();
      }
    });
  }, []);

  if (!poetry) return null;

  return (
    <div className="text-center text-white select-none group flex items-center justify-center gap-2">
      <span className="text-sm font-light tracking-wide text-shadow-sm">
        「{poetry.content}」
      </span>
      <span className="text-xs text-white/70 text-shadow-sm">
        —— {poetry.author}《{poetry.title}》
      </span>
      <button
        onClick={getRandomPoetry}
        className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all inline-flex items-center"
        title="换一首"
      >
        <RefreshCw className="w-3 h-3 text-white/50" />
      </button>
    </div>
  );
}
