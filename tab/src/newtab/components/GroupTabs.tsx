/**
 * 快捷方式分组标签页组件
 */

import { useState } from 'react';
import { Plus, X, LayoutGrid, Folder, Home, Briefcase, GraduationCap, Gamepad2, Wrench, Code, Music, Film, ShoppingCart, Heart, Star, Bookmark, Globe, Zap } from 'lucide-react';
import { useNewtabStore } from '../hooks/useNewtabStore';
import { GROUP_ICONS } from '../constants';

// 图标映射
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Home, Briefcase, GraduationCap, Gamepad2, Wrench, Code, Music, Film,
  ShoppingCart, Heart, Star, Bookmark, Folder, Globe, Zap,
};

// 动态获取图标组件
function getIconComponent(iconName: string) {
  return ICON_MAP[iconName] || Folder;
}

export function GroupTabs() {
  const { shortcutGroups, activeGroupId, setActiveGroup, addGroup, removeGroup } = useNewtabStore();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Folder');

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
    if (confirm('删除分组后，该分组的快捷方式将移到"全部"。确定删除？')) {
      removeGroup(groupId);
    }
  };

  return (
    <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
      {/* 全部 */}
      <button
        onClick={() => setActiveGroup(null)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${
          activeGroupId === null
            ? 'bg-white/20 text-white'
            : 'text-white/60 hover:text-white hover:bg-white/10'
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
        <span>全部</span>
      </button>

      {/* 分组列表 */}
      {shortcutGroups.map((group) => {
        const IconComponent = getIconComponent(group.icon);
        return (
          <button
            key={group.id}
            onClick={() => setActiveGroup(group.id)}
            className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${
              activeGroupId === group.id
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <IconComponent className="w-4 h-4" />
            <span>{group.name}</span>
            {/* 删除按钮 */}
            <X
              className="w-3 h-3 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity ml-1"
              onClick={(e) => handleRemoveGroup(e, group.id)}
            />
          </button>
        );
      })}

      {/* 添加分组按钮 */}
      <div className="relative">
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* 添加分组菜单 */}
        {showAddMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowAddMenu(false)} />
            <div className="absolute top-full left-0 mt-2 w-64 p-3 rounded-xl glass-dark z-50 animate-scaleIn">
              <div className="text-sm text-white/80 mb-2">新建分组</div>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="分组名称"
                className="w-full bg-white/10 text-white text-sm rounded-lg px-3 py-2 mb-3 outline-none border border-white/10 focus:border-white/30"
                autoFocus
              />
              <div className="text-xs text-white/50 mb-2">选择图标</div>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {GROUP_ICONS.map((iconName) => {
                  const Icon = getIconComponent(iconName);
                  return (
                    <button
                      key={iconName}
                      onClick={() => setSelectedIcon(iconName)}
                      className={`p-2 rounded-lg transition-colors ${
                        selectedIcon === iconName
                          ? 'bg-white/20 text-white'
                          : 'text-white/50 hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
              <button
                onClick={handleAddGroup}
                disabled={!newGroupName.trim()}
                className="w-full py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm transition-colors disabled:opacity-50"
              >
                创建
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
