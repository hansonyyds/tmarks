/**
 * 快捷方式文件夹组件 - 液态玻璃效果
 * 参考 iTabs 实现：3x3 网格预览 + 动态光泽
 */

import { useEffect, useRef } from 'react';
import { Folder } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ShortcutFolder, Shortcut } from '../types';
import { getFaviconUrl } from '../utils/favicon';

interface ShortcutFolderItemProps {
  folder: ShortcutFolder;
  shortcuts: Shortcut[];
  onOpen: (folderId: string) => void;
  isMergeTarget?: boolean;
}

// 迷你图标组件
function MiniIcon({ shortcut }: { shortcut: Shortcut }) {
  const faviconUrl = getFaviconUrl(shortcut);
  
  return (
    <div className="aspect-square rounded-md overflow-hidden liquid-glass-mini flex items-center justify-center">
      {faviconUrl ? (
        <img
          src={faviconUrl}
          alt=""
          className="w-full h-full object-cover rounded-md"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            if (target.parentElement) {
              target.parentElement.classList.add('bg-gradient-to-br', 'from-blue-500', 'to-purple-600');
              target.parentElement.innerHTML = `<span class="text-[8px] font-bold text-white">${(shortcut.title?.[0] || 'A').toUpperCase()}</span>`;
            }
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 rounded-md">
          <span className="text-[8px] font-bold text-white">
            {(shortcut.title?.[0] || 'A').toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}

export function ShortcutFolderItem({
  folder,
  shortcuts,
  onOpen,
  isMergeTarget = false,
}: ShortcutFolderItemProps) {
  const folderRef = useRef<HTMLDivElement>(null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: folder.id });

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  // 动态光泽效果 - 跟随鼠标
  useEffect(() => {
    const element = folderRef.current;
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

  // 获取前9个快捷方式用于预览
  const previewShortcuts = shortcuts.slice(0, 9);
  const iconSize = 56; // 图标大小
  const padding = iconSize * 0.12;

  return (
    <div
      ref={setNodeRef}
      style={sortableStyle}
      {...attributes}
      {...listeners}
      data-shortcut-id={folder.id}
      className="relative flex flex-col items-center gap-2 cursor-grab active:cursor-grabbing w-16 min-w-[64px]"
      onClick={() => !isDragging && onOpen(folder.id)}
    >
      {/* 液态玻璃文件夹图标 */}
      <div
        ref={folderRef}
        className={`
          relative liquid-glass-folder rounded-[18px] overflow-hidden
          hover:scale-110 transition-all duration-200
          ${isDragging ? 'shadow-xl ring-2 ring-white/30 scale-105' : ''}
        `}
        style={{
          width: `${iconSize}px`,
          height: `${iconSize}px`,
          padding: `${padding}px`,
        }}
      >
        {/* 玻璃折射效果 */}
        <div className="glass-refraction" />
        
        {/* 3x3 网格预览 */}
        {previewShortcuts.length > 0 ? (
          <div className="w-full h-full grid grid-cols-3 gap-0.5 content-start relative z-10">
            {previewShortcuts.map((shortcut) => (
              <MiniIcon key={shortcut.id} shortcut={shortcut} />
            ))}
            {/* 填充空位 */}
            {Array.from({ length: Math.max(0, 9 - previewShortcuts.length) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="aspect-square rounded-md bg-white/5"
              />
            ))}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center relative z-10">
            <Folder className="w-6 h-6 text-white/60" />
          </div>
        )}

        {/* 合并目标高亮 */}
        {isMergeTarget && <div className="merge-target-highlight" />}
      </div>

      {/* 文件夹名称 */}
      <span className="text-xs text-white truncate w-full text-center px-1 text-shadow-sm">
        {folder.name}
      </span>
    </div>
  );
}
