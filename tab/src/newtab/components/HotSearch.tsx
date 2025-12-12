/**
 * 热搜榜组件
 */

import { useState, useEffect } from 'react';
import { Flame, ChevronDown, ChevronUp, RefreshCw, ExternalLink } from 'lucide-react';
import { HOT_SEARCH_TYPES } from '../constants';
import type { HotSearchItem, HotSearchType } from '../types';

const CACHE_KEY = 'newtab_hotsearch';
const CACHE_DURATION = 10 * 60 * 1000; // 10 分钟

// 热搜 API 配置
const HOT_SEARCH_APIS: Record<HotSearchType, string> = {
  baidu: 'https://api.vvhan.com/api/hotlist/baiduRD',
  weibo: 'https://api.vvhan.com/api/hotlist/wbHot',
  zhihu: 'https://api.vvhan.com/api/hotlist/zhihuHot',
  bilibili: 'https://api.vvhan.com/api/hotlist/bili',
};

interface HotSearchProps {
  type: HotSearchType;
  onTypeChange?: (type: HotSearchType) => void;
}

export function HotSearch({ type, onTypeChange }: HotSearchProps) {
  const [items, setItems] = useState<HotSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const currentType = HOT_SEARCH_TYPES.find((t) => t.id === type) || HOT_SEARCH_TYPES[0];

  const fetchHotSearch = async (force = false) => {
    // 检查缓存
    if (!force) {
      try {
        const result = await chrome.storage.local.get(CACHE_KEY);
        const cache = result[CACHE_KEY] as { type: string; items: HotSearchItem[]; timestamp: number } | undefined;
        if (cache && cache.type === type && Date.now() - cache.timestamp < CACHE_DURATION) {
          setItems(cache.items);
          return;
        }
      } catch {}
    }

    setLoading(true);
    try {
      const res = await fetch(HOT_SEARCH_APIS[type]);
      const data = await res.json();
      
      let hotItems: HotSearchItem[] = [];
      
      if (data.success && data.data) {
        hotItems = data.data.slice(0, 15).map((item: any) => ({
          title: item.title || item.name || item.desc,
          hot: item.hot || item.hotValue || item.index || '',
          url: item.url || item.link || '#',
        }));
      }

      setItems(hotItems);
      
      // 缓存
      chrome.storage.local.set({
        [CACHE_KEY]: { type, items: hotItems, timestamp: Date.now() },
      });
    } catch (error) {
      console.error('Failed to fetch hot search:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotSearch();
  }, [type]);

  const formatHot = (hot: number | string) => {
    if (typeof hot === 'number') {
      if (hot >= 10000) return `${(hot / 10000).toFixed(1)}万`;
      return hot.toString();
    }
    return hot;
  };

  return (
    <div className="w-80 glass rounded-xl p-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-white/80 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <Flame className="w-4 h-4 text-orange-400" />
          </button>
          
          {/* 类型选择 */}
          <div className="relative">
            <button
              onClick={() => setShowTypeMenu(!showTypeMenu)}
              className="text-sm font-medium text-white/80 hover:text-white flex items-center gap-1"
            >
              {currentType.name}
              <ChevronDown className={`w-3 h-3 transition-transform ${showTypeMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showTypeMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowTypeMenu(false)} />
                <div className="absolute top-full left-0 mt-1 w-28 rounded-lg glass-dark overflow-hidden z-50">
                  {HOT_SEARCH_TYPES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onTypeChange?.(t.id as HotSearchType);
                        setShowTypeMenu(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                        t.id === type ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => fetchHotSearch(true)}
          disabled={loading}
          className="p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 text-white/50 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 热搜列表 */}
      {isExpanded && (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center text-white/40 text-sm py-4">
              {loading ? '加载中...' : '暂无数据'}
            </div>
          ) : (
            items.map((item, index) => (
              <a
                key={index}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors group"
              >
                <span
                  className={`w-5 h-5 flex items-center justify-center text-xs font-bold rounded ${
                    index < 3 ? 'bg-orange-500/80 text-white' : 'bg-white/10 text-white/60'
                  }`}
                >
                  {index + 1}
                </span>
                <span className="flex-1 text-sm text-white/80 truncate group-hover:text-white">
                  {item.title}
                </span>
                {item.hot && (
                  <span className="text-xs text-white/40">{formatHot(item.hot)}</span>
                )}
                <ExternalLink className="w-3 h-3 text-white/30 opacity-0 group-hover:opacity-100" />
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
}
