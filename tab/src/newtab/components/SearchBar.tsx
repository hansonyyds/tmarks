/**
 * 搜索框组件 - 支持搜索建议和书签搜索模式
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, BookMarked } from 'lucide-react';
import { SEARCH_ENGINES, FAVICON_API } from '../constants';
import { useNewtabStore } from '../hooks/useNewtabStore';
import { useTMarksSync } from '../hooks/useTMarksSync';
import { SearchEngineSelector } from './SearchEngineSelector';
import type { SearchEngine, SearchResult } from '../types';

// 获取 favicon URL，如果没有则使用 Google API
function getFaviconUrl(favicon: string | undefined, url: string): string {
  if (favicon) return favicon;
  try {
    const domain = new URL(url).hostname;
    return `${FAVICON_API}${domain}&sz=64`;
  } catch {
    return '';
  }
}

interface SearchBarProps {
  engine: SearchEngine;
  enableSuggestions?: boolean;
  onEngineChange?: (engine: SearchEngine) => void;
}

export function SearchBar({ engine, enableSuggestions = true, onEngineChange }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [bookmarkMode, setBookmarkMode] = useState(false); // 书签搜索模式
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const { shortcuts } = useNewtabStore();
  const { searchBookmarks } = useTMarksSync();

  const engineConfig = SEARCH_ENGINES.find((e) => e.id === engine) || SEARCH_ENGINES[0];

  // 搜索本地快捷方式
  const searchShortcuts = useCallback((q: string): SearchResult[] => {
    const lower = q.toLowerCase();
    return shortcuts
      .filter((s) => s.title.toLowerCase().includes(lower) || s.url.toLowerCase().includes(lower))
      .slice(0, 5)
      .map((s) => ({
        id: s.id,
        title: s.title,
        url: s.url,
        favicon: s.favicon,
        source: 'shortcut' as const,
      }));
  }, [shortcuts]);

  // 搜索建议
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    // 防抖
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (bookmarkMode) {
        // 书签模式：只搜索书签和快捷方式
        const localResults = searchShortcuts(query);
        const remoteResults = await searchBookmarks(query);
        const remoteFormatted: SearchResult[] = remoteResults.map((b: { id: string; title: string; url: string; favicon?: string }) => ({
          id: b.id,
          title: b.title,
          url: b.url,
          favicon: b.favicon,
          source: 'bookmark' as const,
        }));

        // 合并去重
        const allResults = [...localResults];
        remoteFormatted.forEach((r) => {
          if (!allResults.some((a) => a.url === r.url)) {
            allResults.push(r);
          }
        });

        setSuggestions(allResults.slice(0, 10));
      } else if (enableSuggestions) {
        // 普通模式：搜索本地和远程书签作为建议
        const localResults = searchShortcuts(query);
        const remoteResults = await searchBookmarks(query);
        const remoteFormatted: SearchResult[] = remoteResults.map((b: { id: string; title: string; url: string; favicon?: string }) => ({
          id: b.id,
          title: b.title,
          url: b.url,
          favicon: b.favicon,
          source: 'bookmark' as const,
        }));

        const allResults = [...localResults];
        remoteFormatted.forEach((r) => {
          if (!allResults.some((a) => a.url === r.url)) {
            allResults.push(r);
          }
        });

        setSuggestions(allResults.slice(0, 8));
      }
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchShortcuts, searchBookmarks, bookmarkMode, enableSuggestions]);

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    const url = engineConfig.url + encodeURIComponent(query.trim());
    window.location.href = url;
  }, [query, engineConfig]);

  const handleSelect = (result: SearchResult) => {
    window.location.href = result.url;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelect(suggestions[selectedIndex]);
      } else if (!bookmarkMode) {
        // 只有非书签模式才跳转搜索引擎
        handleSearch();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  };

  // 书签模式下始终显示结果，普通模式需要开启建议
  const showSuggestions = (bookmarkMode || enableSuggestions) && isFocused && suggestions.length > 0;

  return (
    <div className="relative">
      <div
        className={`
          flex items-center gap-3 px-4 py-3 rounded-full
          glass transition-all duration-200
          ${isFocused ? 'ring-2 ring-white/30 bg-white/15' : 'hover:bg-white/15'}
        `}
      >
        {onEngineChange ? (
          <SearchEngineSelector current={engine} onChange={onEngineChange} />
        ) : (
          <Search className="w-5 h-5 text-white/60 flex-shrink-0" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          placeholder={bookmarkMode ? '搜索书签...' : `在 ${engineConfig.name} 中搜索...`}
          className="flex-1 bg-transparent text-white placeholder-white/50 outline-none text-base"
        />
        
        {/* 书签搜索模式切换按钮 */}
        <button
          onClick={() => setBookmarkMode(!bookmarkMode)}
          className={`p-2 rounded-full transition-all ${
            bookmarkMode
              ? 'bg-blue-500/30 text-blue-400'
              : 'text-white/40 hover:text-white/70 hover:bg-white/10'
          }`}
          title={bookmarkMode ? '切换到搜索引擎' : '切换到书签搜索'}
        >
          <BookMarked className="w-4 h-4" />
        </button>
      </div>

      {/* 搜索建议 */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl glass-dark overflow-hidden animate-scaleIn z-[100]">
          {suggestions.map((result, index) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 text-left
                transition-colors
                ${index === selectedIndex ? 'bg-white/20' : 'hover:bg-white/10'}
              `}
            >
              <img 
                src={getFaviconUrl(result.favicon, result.url)} 
                alt="" 
                className="w-5 h-5 rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">{result.title}</div>
                <div className="text-xs text-white/50 truncate">{result.url}</div>
              </div>
              <span className="text-xs text-white/30">
                {result.source === 'shortcut' ? '快捷方式' : '书签'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
