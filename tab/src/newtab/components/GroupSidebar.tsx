/**
 * 左侧分组侧边栏组件 - 参考 mtab 布局（纯图标垂直导航）
 */

import { useState, useEffect } from 'react';
import {
  Plus,
  X,
  Folder,
  Home,
  Briefcase,
  GraduationCap,
  Gamepad2,
  Wrench,
  Code,
  Music,
  Film,
  ShoppingCart,
  Heart,
  Star,
  Bookmark,
  Globe,
  Zap,
  BookMarked,
  Settings,
} from 'lucide-react';
import { useNewtabStore } from '../hooks/useNewtabStore';
import { GROUP_ICONS } from '../constants';
import { StorageService } from '@/lib/utils/storage';
import { getTMarksUrls } from '@/lib/constants/urls';

// 图标映射
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  Briefcase,
  GraduationCap,
  Gamepad2,
  Wrench,
  Code,
  Music,
  Film,
  ShoppingCart,
  Heart,
  Star,
  Bookmark,
  Folder,
  Globe,
  Zap,
};

function getIconComponent(iconName: string) {
  return ICON_MAP[iconName] || Folder;
}

interface GroupSidebarProps {
  onOpenSettings?: () => void;
}

export function GroupSidebar({ onOpenSettings }: GroupSidebarProps) {
  const { shortcutGroups, activeGroupId, setActiveGroup, addGroup, removeGroup } =
    useNewtabStore();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Folder');
  const [tmarksUrl, setTmarksUrl] = useState('');
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

  // 加载用户配置的 TMarks URL
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

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      addGroup(newGroupName.trim(), selectedIcon);
      setNewGroupName('');
      setSelectedIcon('Folder');
      setShowAddMenu(false);
    }
  };

  const handleRemoveGroup = (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm('删除分组后，该分组的快捷方式将移到"首页"。确定删除？')) {
      removeGroup(groupId);
    }
  };

  return (
    <div className="fixed left-3 top-1/2 -translate-y-1/2 z-20 glass rounded-2xl p-2 animate-fadeIn flex flex-col gap-1">
      {/* 分组列表 */}
      {shortcutGroups.map((group) => {
        // 首页分组不允许删除
        const canDelete = group.id !== 'home';
        const IconComponent = getIconComponent(group.icon);
        return (
          <button
            key={group.id}
            onClick={() => setActiveGroup(group.id)}
            onMouseEnter={() => setHoveredGroup(group.id)}
            onMouseLeave={() => setHoveredGroup(null)}
            onContextMenu={(e) => handleRemoveGroup(e, group.id)}
            className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeGroupId === group.id
                ? 'bg-white/20 text-white'
                : 'text-white/50 hover:text-white/80 hover:bg-white/10'
            }`}
            title={group.name}
          >
            <IconComponent className="w-4 h-4" />
            {hoveredGroup === group.id && (
              <div className="absolute left-full ml-2 px-2 py-1 rounded-lg bg-black/80 text-white text-xs whitespace-nowrap z-50 flex items-center gap-2">
                {group.name}
                {canDelete && (
                  <X
                    className="w-3 h-3 hover:text-red-400 cursor-pointer"
                    onClick={(e) => handleRemoveGroup(e, group.id)}
                  />
                )}
              </div>
            )}
          </button>
        );
      })}

      {/* 分隔线 */}
      <div className="w-6 h-px bg-white/20 mx-auto my-1" />

      {/* 添加分组 */}
      <div className="relative">
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          onMouseEnter={() => setHoveredGroup('add')}
          onMouseLeave={() => setHoveredGroup(null)}
          className="relative w-10 h-10 rounded-xl flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/10 transition-all"
          title="新建分组"
        >
          <Plus className="w-4 h-4" />
          {hoveredGroup === 'add' && !showAddMenu && (
            <div className="absolute left-full ml-2 px-2 py-1 rounded-lg bg-black/80 text-white text-xs whitespace-nowrap z-50">
              新建分组
            </div>
          )}
        </button>

        {showAddMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowAddMenu(false)}
            />
            <div className="absolute left-full top-0 ml-2 w-56 p-3 rounded-xl bg-gray-900/95 border border-white/10 shadow-2xl z-50 animate-scaleIn">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">新建分组</span>
                <button
                  onClick={() => setShowAddMenu(false)}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                >
                  <X className="w-3 h-3 text-white/60" />
                </button>
              </div>

              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="分组名称"
                className="w-full bg-white/10 text-white text-sm rounded-lg px-3 py-2 mb-3 outline-none border border-white/20 focus:border-blue-500/50 placeholder:text-white/40"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
              />

              <div className="grid grid-cols-5 gap-1.5 mb-3">
                {GROUP_ICONS.map((iconName) => {
                  const Icon = getIconComponent(iconName);
                  return (
                    <button
                      key={iconName}
                      onClick={() => setSelectedIcon(iconName)}
                      className={`p-1.5 rounded-lg transition-all ${
                        selectedIcon === iconName
                          ? 'bg-blue-500/30 text-blue-400 ring-1 ring-blue-500/50'
                          : 'text-white/50 hover:bg-white/10 hover:text-white/80'
                      }`}
                    >
                      <Icon className="w-4 h-4 mx-auto" />
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleAddGroup}
                disabled={!newGroupName.trim()}
                className="w-full py-1.5 rounded-lg bg-blue-500/80 hover:bg-blue-500 text-white text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                创建
              </button>
            </div>
          </>
        )}
      </div>

      {/* 分隔线 */}
      {tmarksUrl && <div className="w-6 h-px bg-white/20 mx-auto my-1" />}

      {/* TMarks 入口 */}
      {tmarksUrl && (
        <button
          onClick={() => window.open(tmarksUrl, '_blank')}
          onMouseEnter={() => setHoveredGroup('tmarks')}
          onMouseLeave={() => setHoveredGroup(null)}
          className="relative w-10 h-10 rounded-xl flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/10 transition-all"
          title="TMarks 书签"
        >
          <BookMarked className="w-4 h-4" />
          {hoveredGroup === 'tmarks' && (
            <div className="absolute left-full ml-2 px-2 py-1 rounded-lg bg-black/80 text-white text-xs whitespace-nowrap z-50">
              书签管理
            </div>
          )}
        </button>
      )}

      {/* 分隔线 */}
      <div className="w-6 h-px bg-white/20 mx-auto my-1" />

      {/* 设置按钮 */}
      <button
        onClick={onOpenSettings}
        onMouseEnter={() => setHoveredGroup('settings')}
        onMouseLeave={() => setHoveredGroup(null)}
        className="relative w-10 h-10 rounded-xl flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/10 transition-all"
        title="设置"
      >
        <Settings className="w-4 h-4" />
        {hoveredGroup === 'settings' && (
          <div className="absolute left-full ml-2 px-2 py-1 rounded-lg bg-black/80 text-white text-xs whitespace-nowrap z-50">
            设置
          </div>
        )}
      </button>
    </div>
  );
}
