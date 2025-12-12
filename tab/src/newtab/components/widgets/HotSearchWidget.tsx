/**
 * 热搜榜组件 - 网格版本
 */

import { useState, useEffect, memo } from 'react';
import { Flame, ChevronDown, RefreshCw, ExternalLink, X } from 'lucide-react';
import { HOT_SEARCH_TYPES } from '../../constants';
import type { HotSearchItem, HotSearchType } from '../../types';
import type { WidgetRendererProps } from './types';
import { getSizeSpan } from './widgetRegistry';

const CACHE_KEY = 'newtab_hotsearch';
const CACHE_DURATION = 10 * 60 * 1000; // 10 分钟

const HOT_SEARCH_APIS: Record<HotSearchType, string> = {
  baidu: 'https://api.vvhan.com/api/hotlist/baiduRD',
  weibo: 'https://api.vvhan.com/api/hotlist/wbHot',
  zhihu: 'https://api.vvhan.com/api/hotlist/zhihuHot',
  bilibili: 'https://api.vvhan.com/api/hotlist/bili',
};

export const HotSearchWidget = memo(function HotSearchWidget({
  item,
  onUpdate,
  onRemove,
  isEditing,
}: WidgetRendererProps) {
  const [items, setItems] = useState<HotSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const { rows } = getSizeSpan(item.size);

  const type = (item.config?.hotsearch?.type || 'baidu') as HotSearchType;
  const currentType = HOT_SEARCH_TYPES.find((t) => t.id === type) || HOT_SEARCH_TYPES[0];

  // 根据尺寸计算最大显示数量
  const maxItems = rows <= 2 ? 5 : rows <= 3 ? 10 : 15;

  const fetchHotSearch = async (force = false) => {
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

  const handleTypeChange = (newType: HotSearchType) => {
    onUpdate?.(item.id, {
      config: { ...item.config, hotsearch: { type: newType } },
    });
    setShowTypeMenu(false);
  };



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
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" />
          
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
                <div className="absolute top-full left-0 mt-1 w-24 rounded-lg glass-dark overflow-hidden z-50">
                  {HOT_SEARCH_TYPES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleTypeChange(t.id as HotSearchType)}
                      className={`w-full px-3 py-1.5 text-left text-sm transition-colors ${
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
      <div className="flex-1 space-y-0.5 overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center text-white/40 text-sm py-4">
            {loading ? '加载中...' : '暂无数据'}
          </div>
        ) : (
          items.slice(0, maxItems).map((hotItem, index) => (
            <a
              key={index}
              href={hotItem.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/10 transition-colors group/item"
            >
              <span
                className={`w-4 h-4 flex items-center justify-center text-xs font-bold rounded flex-shrink-0 ${
                  index < 3 ? 'bg-orange-500/80 text-white' : 'bg-white/10 text-white/60'
                }`}
              >
                {index + 1}
              </span>
              <span className="flex-1 text-sm text-white/80 truncate group-hover/item:text-white">
                {hotItem.title}
              </span>
              <ExternalLink className="w-3 h-3 text-white/30 opacity-0 group-hover/item:opacity-100 flex-shrink-0" />
            </a>
          ))
        )}
      </div>
    </div>
  );
});
