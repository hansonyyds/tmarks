/**
 * TMarks 置顶书签组件 - 横向滑动显示
 */

import { useEffect, useState, useRef } from 'react';
import { RefreshCw, Pin, AlertCircle, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTMarksSync } from '../hooks/useTMarksSync';

// 获取 favicon URL，优先使用书签自带的，否则使用 Google Favicon API
function getFaviconUrl(url: string, favicon?: string): string {
  if (favicon) return favicon;
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return '';
  }
}

export function PinnedBookmarks() {
  const { syncState, pinnedBookmarks, fetchPinnedBookmarks } = useTMarksSync();
  const [hasLoaded, setHasLoaded] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    fetchPinnedBookmarks().finally(() => setHasLoaded(true));
  }, [fetchPinnedBookmarks]);

  // 检查滚动状态
  const checkScrollState = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollState();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollState);
      window.addEventListener('resize', checkScrollState);
      return () => {
        container.removeEventListener('scroll', checkScrollState);
        window.removeEventListener('resize', checkScrollState);
      };
    }
  }, [pinnedBookmarks]);

  // 滚动控制
  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // 打开扩展设置页面
  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  // 加载中状态
  if (!hasLoaded && syncState.isSyncing) {
    return (
      <div className="w-full max-w-4xl mt-8">
        <div className="flex items-center justify-center gap-2 text-white/50 py-4">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">加载置顶书签...</span>
        </div>
      </div>
    );
  }

  // 错误状态 - 显示配置提示
  if (syncState.error) {
    return (
      <div className="w-full max-w-4xl mt-8">
        <div className="flex flex-col items-center gap-3 p-4 rounded-xl glass">
          <div className="flex items-center gap-2 text-white/60">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{syncState.error}</span>
          </div>
          <button
            onClick={openOptions}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm text-white/80"
          >
            <Settings className="w-4 h-4" />
            配置 TMarks
          </button>
        </div>
      </div>
    );
  }

  // 无书签状态
  if (pinnedBookmarks.length === 0) {
    return (
      <div className="w-full max-w-4xl mt-8">
        <div className="flex flex-col items-center gap-2 p-4 rounded-xl glass text-white/50">
          <Pin className="w-5 h-5" />
          <span className="text-sm">暂无置顶书签</span>
          <span className="text-xs text-white/30">在 TMarks 中置顶书签后会显示在这里</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mt-8">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2 text-white/60">
          <Pin className="w-4 h-4" />
          <span className="text-sm">置顶书签</span>
          <span className="text-xs text-white/40">({pinnedBookmarks.length})</span>
        </div>
        <button
          onClick={() => fetchPinnedBookmarks()}
          disabled={syncState.isSyncing}
          className="p-1.5 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
          title="刷新"
        >
          <RefreshCw
            className={`w-4 h-4 text-white/50 ${syncState.isSyncing ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* 横向滑动书签列表 */}
      <div className="relative group">
        {/* 左滚动按钮 */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full glass bg-black/30 hover:bg-black/50 transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
        )}

        {/* 书签滚动容器 */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-1 py-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {pinnedBookmarks.map((bookmark) => (
            <a
              key={bookmark.id}
              href={bookmark.url}
              className="flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl glass hover:bg-white/20 transition-all duration-200 w-20"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
                <img
                  src={getFaviconUrl(bookmark.url, bookmark.favicon)}
                  alt={bookmark.title}
                  className="w-8 h-8 rounded-lg object-contain"
                  onError={(e) => {
                    const target = e.currentTarget;
                    const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=64`;
                    if (!target.src.includes('google.com/s2/favicons')) {
                      target.src = googleFaviconUrl;
                    } else {
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.fallback-letter')) {
                        parent.classList.add('bg-white/10');
                        const span = document.createElement('span');
                        span.className = 'fallback-letter text-lg font-medium text-white/70';
                        span.textContent = bookmark.title.charAt(0).toUpperCase();
                        parent.appendChild(span);
                      }
                    }
                  }}
                />
              </div>
              <span className="text-xs text-white/70 truncate w-full text-center">
                {bookmark.title}
              </span>
            </a>
          ))}
        </div>

        {/* 右滚动按钮 */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full glass bg-black/30 hover:bg-black/50 transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        )}
      </div>
    </div>
  );
}
