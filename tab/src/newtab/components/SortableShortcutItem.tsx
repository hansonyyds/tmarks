/**
 * 可排序的快捷方式项组件 - 液态玻璃效果
 */

import { useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNewtabStore } from '../hooks/useNewtabStore';
import { getFaviconUrl } from '../utils/favicon';
import type { Shortcut } from '../types';

interface SortableShortcutItemProps {
  shortcut: Shortcut;
  style?: 'icon' | 'card';
  onContextMenu?: (e: React.MouseEvent, shortcut: Shortcut) => void;
  isMergeTarget?: boolean;
}

export function SortableShortcutItem({ 
  shortcut, 
  onContextMenu,
  isMergeTarget = false,
}: SortableShortcutItemProps) {
  const { incrementClickCount } = useNewtabStore();
  const iconRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: shortcut.id });

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1, // 拖拽时完全隐藏，由 DragOverlay 显示
    zIndex: isDragging ? 10 : 1,
  };

  // 动态光泽效果 - 跟随鼠标
  useEffect(() => {
    const element = iconRef.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      element.style.setProperty('--mouse-x', `${x}%`);
      element.style.setProperty('--mouse-y', `${y}%`);
    };

    element.addEventListener('mousemove', handleMouseMove);
    return () => element.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleClick = () => {
    if (!isDragging) {
      incrementClickCount(shortcut.id);
      window.location.href = shortcut.url;
    }
  };

  const faviconUrl = getFaviconUrl(shortcut);

  return (
    <div
      ref={setNodeRef}
      style={sortableStyle}
      {...attributes}
      {...listeners}
      data-shortcut-id={shortcut.id}
      className={`
        relative flex flex-col items-center gap-2 cursor-grab active:cursor-grabbing
        w-16 min-w-[64px] group
        transition-all duration-300 hover:scale-105 hover:z-10
      `}
      onClick={handleClick}
      onContextMenu={(e) => {
        e.preventDefault();
        if (onContextMenu) {
          onContextMenu(e, shortcut);
        }
      }}
    >
      {/* 液态玻璃图标 */}
      <div
        ref={iconRef}
        className={`
          relative w-14 h-14 rounded-[18px] liquid-glass-icon flex items-center justify-center overflow-hidden
          transition-all duration-200
          ${isDragging ? 'shadow-xl ring-2 ring-white/30 scale-105' : ''}
        `}
      >
        {/* 玻璃折射效果 */}
        <div className="glass-refraction" />
        
        {/* 图标 */}
        {faviconUrl ? (
          <img
            src={faviconUrl}
            alt={shortcut.title}
            className="w-[85%] h-[85%] object-contain rounded-xl relative z-10"
            draggable={false}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent && !parent.querySelector('.fallback-letter')) {
                const fallback = document.createElement('div');
                fallback.className = 'fallback-letter w-[80%] h-[80%] flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl';
                fallback.innerHTML = `<span class="text-2xl font-bold text-white">${shortcut.title.charAt(0).toUpperCase()}</span>`;
                parent.appendChild(fallback);
              }
            }}
          />
        ) : (
          <div className="w-[80%] h-[80%] flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl relative z-10">
            <span className="text-2xl font-bold text-white">
              {shortcut.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* 合并目标高亮 */}
        {isMergeTarget && <div className="merge-target-highlight" />}
      </div>

      {/* 标题 */}
      <span className="text-sm font-medium text-white/90 drop-shadow-md truncate text-center w-full px-1 select-none">
        {shortcut.title}
      </span>
    </div>
  );
}
