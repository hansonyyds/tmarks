/**
 * 每日诗词组件 - 网格版本
 */

import { useState, useEffect, memo } from 'react';
import { RefreshCw, BookOpen, X } from 'lucide-react';
import { DEFAULT_POETRY } from '../../constants';
import type { Poetry as PoetryType } from '../../types';
import type { WidgetRendererProps } from './types';
import { getSizeSpan } from './widgetRegistry';

const POETRY_CACHE_KEY = 'newtab_poetry';

export const PoetryWidget = memo(function PoetryWidget({
  item,
  onRemove,
  isEditing,
}: WidgetRendererProps) {
  const [poetry, setPoetry] = useState<PoetryType | null>(null);
  const { rows } = getSizeSpan(item.size);
  const isLarge = rows >= 2;

  const getRandomPoetry = () => {
    const index = Math.floor(Math.random() * DEFAULT_POETRY.length);
    const newPoetry = DEFAULT_POETRY[index];
    setPoetry(newPoetry);
    
    const today = new Date().toDateString();
    chrome.storage.local.set({
      [POETRY_CACHE_KEY]: { poetry: newPoetry, date: today },
    });
  };

  useEffect(() => {
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
    <div className="group relative h-full p-3 rounded-xl glass-card flex flex-col items-center justify-center">
      {isEditing && onRemove && (
        <button
          onClick={() => onRemove(item.id)}
          className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 text-white 
                     opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {isLarge ? (
        // 大尺寸布局
        <div className="flex flex-col items-center gap-2 text-center">
          <BookOpen className="w-5 h-5 text-white/60" />
          <p className="text-base text-white/90 font-light tracking-wide">
            「{poetry.content}」
          </p>
          <p className="text-sm text-white/60">
            —— {poetry.author}《{poetry.title}》
          </p>
          <button
            onClick={getRandomPoetry}
            className="mt-2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
            title="换一首"
          >
            <RefreshCw className="w-3 h-3 text-white/50" />
          </button>
        </div>
      ) : (
        // 紧凑布局
        <div className="flex items-center gap-2 w-full">
          <div className="flex-1 text-center">
            <span className="text-sm text-white/80 font-light tracking-wide">
              「{poetry.content}」
            </span>
            <span className="text-xs text-white/50 ml-2">
              —— {poetry.author}
            </span>
          </div>
          <button
            onClick={getRandomPoetry}
            className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all flex-shrink-0"
            title="换一首"
          >
            <RefreshCw className="w-3 h-3 text-white/50" />
          </button>
        </div>
      )}
    </div>
  );
});
