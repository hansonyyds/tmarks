/**
 * 设置面板组件 - 多标签页版本
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Cloud, User, ExternalLink, Palette } from 'lucide-react';
import { useNewtabStore } from '../hooks/useNewtabStore';
import { SEARCH_ENGINES } from '../constants';
import { StorageService } from '@/lib/utils/storage';
import { getTMarksUrls } from '@/lib/constants/urls';
import { Z_INDEX } from '../constants/z-index';
import type { ClockFormat, SearchEngine, WallpaperType } from '../types';

interface SettingsPanelProps {
  onClose: () => void;
}

type SettingsTab = 'general' | 'appearance' | 'sync';

const TABS = [
  { id: 'general' as const, label: '常规', icon: User },
  { id: 'appearance' as const, label: '外观', icon: Palette },
  { id: 'sync' as const, label: '同步', icon: Cloud },
];

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { settings, updateSettings } = useNewtabStore();
  const [tmarksUrl, setTmarksUrl] = useState('');
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // 加载 TMarks 网站 URL
  useEffect(() => {
    const loadTMarksUrl = async () => {
      const config = await StorageService.getTMarksConfig();
      if (config?.bookmarkApiUrl) {
        const baseUrl = config.bookmarkApiUrl.replace(/\/api\/?$/, '');
        setTmarksUrl(baseUrl);
      } else {
        setTmarksUrl(getTMarksUrls().BASE_URL);
      }
    };
    loadTMarksUrl();
  }, []);

  // 使用 Portal 直接渲染到 body，确保在全局层级
  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 animate-fadeIn"
      style={{ zIndex: Z_INDEX.MODAL_BACKDROP }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl h-[600px] rounded-2xl glass-modal-dark flex flex-col overflow-hidden"
        style={{ zIndex: Z_INDEX.MODAL_CONTENT, animation: 'modalScale 0.2s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-medium text-white">设置</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* 底部容器：左侧标签栏 + 右侧内容区 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧标签栏 */}
          <div className="w-48 flex-shrink-0 border-r border-white/10 py-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-white bg-white/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* 右侧内容区 */}
          <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* 个性化 */}
              <SettingSection title="个性化">
                <ToggleItem
                  label="显示问候语"
                  checked={settings.showGreeting}
                  onChange={(v) => updateSettings({ showGreeting: v })}
                />
                <TextItem
                  label="你的名字"
                  value={settings.userName}
                  placeholder="可选"
                  onChange={(v) => updateSettings({ userName: v })}
                />
              </SettingSection>

              {/* 时钟 */}
              <SettingSection title="时钟">
                <ToggleItem
                  label="显示时钟"
                  checked={settings.showClock}
                  onChange={(v) => updateSettings({ showClock: v })}
                />
                {settings.showClock && (
                  <>
                    <ToggleItem
                      label="显示日期"
                      checked={settings.showDate}
                      onChange={(v) => updateSettings({ showDate: v })}
                    />
                    <ToggleItem
                      label="显示秒数"
                      checked={settings.showSeconds}
                      onChange={(v) => updateSettings({ showSeconds: v })}
                    />
                    <ToggleItem
                      label="显示农历"
                      checked={settings.showLunar}
                      onChange={(v) => updateSettings({ showLunar: v })}
                    />
                    <SelectItem
                      label="时间格式"
                      value={settings.clockFormat}
                      options={[
                        { value: '24h', label: '24 小时制' },
                        { value: '12h', label: '12 小时制' },
                      ]}
                      onChange={(v) => updateSettings({ clockFormat: v as ClockFormat })}
                    />
                  </>
                )}
              </SettingSection>

              {/* 诗词 */}
              <SettingSection title="诗词">
                <ToggleItem
                  label="显示每日诗词"
                  checked={settings.showPoetry}
                  onChange={(v) => updateSettings({ showPoetry: v })}
                />
              </SettingSection>

              {/* 搜索 */}
              <SettingSection title="搜索">
                <ToggleItem
                  label="显示搜索框"
                  checked={settings.showSearch}
                  onChange={(v) => updateSettings({ showSearch: v })}
                />
                <SelectItem
                  label="搜索引擎"
                  value={settings.searchEngine}
                  options={SEARCH_ENGINES.map((e) => ({ value: e.id, label: e.name }))}
                  onChange={(v) => updateSettings({ searchEngine: v as SearchEngine })}
                />
              </SettingSection>

              {/* 离线缓存 */}
              <SettingSection title="离线缓存">
                <CacheFaviconsButton />
              </SettingSection>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* 快捷方式 */}
              <SettingSection title="快捷方式">
                <ToggleItem
                  label="显示快捷方式"
                  checked={settings.showShortcuts}
                  onChange={(v) => updateSettings({ showShortcuts: v })}
                />
                <SelectItem
                  label="每行数量"
                  value={String(settings.shortcutColumns)}
                  options={[
                    { value: '6', label: '6 个' },
                    { value: '8', label: '8 个' },
                    { value: '10', label: '10 个' },
                  ]}
                  onChange={(v) => updateSettings({ shortcutColumns: Number(v) as 6 | 8 | 10 })}
                />
              </SettingSection>

              {/* 壁纸 */}
              <SettingSection title="壁纸">
                <SelectItem
                  label="壁纸类型"
                  value={settings.wallpaper.type}
                  options={[
                    { value: 'color', label: '纯色' },
                    { value: 'bing', label: 'Bing 每日壁纸' },
                    { value: 'unsplash', label: '随机风景' },
                    { value: 'image', label: '自定义图片' },
                  ]}
                  onChange={(v) =>
                    updateSettings({
                      wallpaper: { ...settings.wallpaper, type: v as WallpaperType },
                    })
                  }
                />
                {settings.wallpaper.type === 'color' && (
                  <ColorItem
                    label="背景颜色"
                    value={settings.wallpaper.value}
                    onChange={(v) =>
                      updateSettings({ wallpaper: { ...settings.wallpaper, value: v } })
                    }
                  />
                )}
                {settings.wallpaper.type === 'image' && (
                  <TextItem
                    label="图片 URL"
                    value={settings.wallpaper.value}
                    placeholder="https://..."
                    onChange={(v) =>
                      updateSettings({ wallpaper: { ...settings.wallpaper, value: v } })
                    }
                  />
                )}
                <RangeItem
                  label="模糊"
                  value={settings.wallpaper.blur}
                  min={0}
                  max={20}
                  onChange={(v) =>
                    updateSettings({ wallpaper: { ...settings.wallpaper, blur: v } })
                  }
                />
                <RangeItem
                  label="亮度"
                  value={settings.wallpaper.brightness}
                  min={20}
                  max={100}
                  onChange={(v) =>
                    updateSettings({ wallpaper: { ...settings.wallpaper, brightness: v } })
                  }
                />
              </SettingSection>
            </div>
          )}



          {activeTab === 'sync' && (
            <div className="space-y-6">
              <SettingSection title="TMarks 同步">
                <ToggleItem
                  label="显示置顶书签"
                  checked={settings.showPinnedBookmarks}
                  onChange={(v) => updateSettings({ showPinnedBookmarks: v })}
                />
                <ToggleItem
                  label="搜索建议"
                  checked={settings.enableSearchSuggestions}
                  onChange={(v) => updateSettings({ enableSearchSuggestions: v })}
                />
                {tmarksUrl && (
                  <a
                    href={tmarksUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 mt-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <span className="text-sm text-white/70">打开 TMarks 网站</span>
                    <ExternalLink className="w-4 h-4 text-white/50" />
                  </a>
                )}
                <div className="text-xs text-white/40 mt-2">
                  在扩展设置中配置 API Key 以启用同步功能
                </div>
              </SettingSection>

              <SettingSection title="自动刷新">
                <ToggleItem
                  label="定时刷新置顶书签"
                  checked={settings.autoRefreshPinnedBookmarks}
                  onChange={(v) => updateSettings({ autoRefreshPinnedBookmarks: v })}
                />
                {settings.autoRefreshPinnedBookmarks && (
                  <>
                    <SelectItem
                      label="刷新时间"
                      value={settings.pinnedBookmarksRefreshTime}
                      options={[
                        { value: 'morning', label: '早上 8:00' },
                        { value: 'evening', label: '晚上 22:00' },
                      ]}
                      onChange={(v) => updateSettings({ pinnedBookmarksRefreshTime: v as 'morning' | 'evening' })}
                    />
                    <div className="text-xs text-white/40 -mt-1 ml-1">
                      每天自动更新置顶书签缓存，保持数据最新
                    </div>
                  </>
                )}
              </SettingSection>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// 设置分组
function SettingSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/5 rounded-xl p-4">
      <h3 className="text-sm font-medium text-white/80 mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// 开关项
function ToggleItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-white/80">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full transition-colors ${
          checked ? 'bg-blue-500' : 'bg-white/20'
        }`}
      >
        <div
          className={`w-4 h-4 rounded-full bg-white transition-transform mx-1 ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

// 选择项
function SelectItem({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-white/80">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white/10 text-white text-sm rounded-lg px-3 py-1.5 outline-none border border-white/10"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-gray-800">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// 颜色选择
function ColorItem({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-white/80">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded cursor-pointer"
      />
    </div>
  );
}

// 文本输入
function TextItem({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-white/80 flex-shrink-0">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-white/10 text-white text-sm rounded-lg px-3 py-1.5 outline-none border border-white/10"
      />
    </div>
  );
}

// 滑块
function RangeItem({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-white/80">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="range"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24"
        />
        <span className="text-xs text-white/60 w-8">{value}</span>
      </div>
    </div>
  );
}

// 缓存图标按钮
function CacheFaviconsButton() {
  const { shortcuts, updateShortcut, gridItems, updateGridItem } = useNewtabStore();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [storageInfo, setStorageInfo] = useState<{ used: number; total: number } | null>(null);

  // 加载存储信息
  useEffect(() => {
    const loadStorageInfo = async () => {
      try {
        const bytes = await chrome.storage.local.getBytesInUse();
        const quota = chrome.storage.local.QUOTA_BYTES || 10485760; // 10MB 默认配额
        setStorageInfo({ used: bytes, total: quota });
      } catch (error) {
        console.error('Failed to get storage info:', error);
      }
    };
    loadStorageInfo();
  }, [isLoading]);

  const handleCacheFavicons = async () => {
    setIsLoading(true);
    setProgress({ current: 0, total: 0 });

    try {
      const { batchDownloadFavicons } = await import('../utils/favicon');
      let totalCached = 0;
      
      // 缓存旧版快捷方式图标
      if (shortcuts.length > 0) {
        const results = await batchDownloadFavicons(shortcuts, (current, total) => {
          setProgress({ current, total });
        });
        
        // 更新快捷方式
        results.forEach((base64, id) => {
          updateShortcut(id, { faviconBase64: base64 });
        });
        totalCached += results.size;
      }

      // 缓存网格项中的快捷方式图标
      const gridShortcuts = gridItems.filter(item => item.type === 'shortcut' && item.shortcut);
      if (gridShortcuts.length > 0) {
        const gridResults = await batchDownloadFavicons(
          gridShortcuts.map(item => ({
            id: item.id,
            url: item.shortcut!.url,
            favicon: item.shortcut!.favicon,
            faviconBase64: item.shortcut!.faviconBase64,
          })),
          (current, total) => {
            setProgress({ current: current + shortcuts.length, total: total + shortcuts.length });
          }
        );

        // 更新网格项
        gridResults.forEach((base64, id) => {
          const item = gridItems.find(i => i.id === id);
          if (item?.shortcut) {
            updateGridItem(id, {
              shortcut: {
                ...item.shortcut,
                faviconBase64: base64,
              },
            });
          }
        });
        totalCached += gridResults.size;
      }

      alert(`成功缓存 ${totalCached} 个图标`);
    } catch (error) {
      console.error('Failed to cache favicons:', error);
      alert('缓存图标失败，请重试');
    } finally {
      setIsLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const totalShortcuts = shortcuts.length + gridItems.filter(item => item.type === 'shortcut').length;
  const cachedCount = shortcuts.filter(s => s.faviconBase64).length + 
    gridItems.filter(item => item.type === 'shortcut' && item.shortcut?.faviconBase64).length;

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-sm text-white/80">下载并缓存所有图标</div>
          <div className="text-xs text-white/50 mt-1">
            已缓存 {cachedCount} / {totalShortcuts} 个图标
          </div>
          {storageInfo && (
            <div className="text-xs text-white/40 mt-0.5">
              存储占用: {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.total)} 
              ({((storageInfo.used / storageInfo.total) * 100).toFixed(1)}%)
            </div>
          )}
        </div>
        <button
          onClick={handleCacheFavicons}
          disabled={isLoading}
          className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-white/20 text-white text-sm transition-colors"
        >
          {isLoading ? '缓存中...' : '立即缓存'}
        </button>
      </div>
      {isLoading && progress.total > 0 && (
        <div className="space-y-1">
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <div className="text-xs text-white/50 text-center">
            {progress.current} / {progress.total}
          </div>
        </div>
      )}
      <div className="text-xs text-white/40 leading-relaxed">
        图标会自动压缩到 10KB 以内，离线时可正常显示
      </div>
    </div>
  );
}


