/**
 * 快捷方式项组件
 */

import { useState } from 'react';
import { X, Pencil } from 'lucide-react';
import { useNewtabStore } from '../hooks/useNewtabStore';
import { getFaviconUrl } from '../utils/favicon';
import type { Shortcut } from '../types';

interface ShortcutItemProps {
  shortcut: Shortcut;
  style: 'icon' | 'card';
}

export function ShortcutItem({ shortcut, style }: ShortcutItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { removeShortcut, updateShortcut, incrementClickCount } = useNewtabStore();

  const handleClick = () => {
    incrementClickCount(shortcut.id);
    window.location.href = shortcut.url;
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newTitle = prompt('修改名称:', shortcut.title);
    if (newTitle && newTitle !== shortcut.title) {
      updateShortcut(shortcut.id, { title: newTitle });
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeShortcut(shortcut.id);
  };

  const faviconUrl = getFaviconUrl(shortcut);

  return (
    <div
      className={`
        relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl
        glass hover:bg-white/20 transition-all duration-200 cursor-pointer
        ${style === 'card' ? 'aspect-square' : ''}
      `}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 操作按钮 */}
      {isHovered && (
        <div className="absolute top-1 right-1 flex gap-1 animate-scaleIn">
          <button
            onClick={handleEdit}
            className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <Pencil className="w-3 h-3 text-white" />
          </button>
          <button
            onClick={handleRemove}
            className="p-1 rounded-full bg-white/20 hover:bg-red-500/80 transition-colors"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      )}

      {/* 图标 */}
      <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden">
        {faviconUrl ? (
          <img
            src={faviconUrl}
            alt={shortcut.title}
            className="w-10 h-10 rounded-lg object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent && !parent.querySelector('.fallback-letter')) {
                parent.classList.add('bg-white/10');
                const span = document.createElement('span');
                span.className = 'fallback-letter text-lg font-medium text-white';
                span.textContent = shortcut.title.charAt(0).toUpperCase();
                parent.appendChild(span);
              }
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
            <span className="text-lg font-medium text-white">
              {shortcut.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* 标题 */}
      <span className="text-xs text-white/80 truncate max-w-full px-1">
        {shortcut.title}
      </span>
    </div>
  );
}
