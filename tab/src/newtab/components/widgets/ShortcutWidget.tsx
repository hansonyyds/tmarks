/**
 * 快捷方式组件 - 网格版本
 */

import { memo } from 'react';
import { X } from 'lucide-react';
import type { WidgetRendererProps } from './types';
import { getFaviconUrl } from '../../utils/favicon';

export const ShortcutWidget = memo(function ShortcutWidget({
  item,
  onRemove,
  isEditing,
}: WidgetRendererProps) {
  const shortcut = item.shortcut;
  
  if (!shortcut) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    if (isEditing) {
      e.preventDefault();
    }
  };

  const favicon = getFaviconUrl(shortcut);

  return (
    <a
      href={isEditing ? undefined : shortcut.url}
      onClick={handleClick}
      className="group relative flex flex-col items-center justify-center h-full p-2 rounded-xl 
                 glass-card hover:bg-white/20 transition-all duration-200 cursor-pointer"
    >
      {isEditing && onRemove && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove(item.id);
          }}
          className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 text-white 
                     opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <X className="w-3 h-3" />
        </button>
      )}
      
      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
        <img
          src={favicon}
          alt={shortcut.title}
          className="w-6 h-6"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              const span = document.createElement('span');
              span.className = 'text-lg font-medium text-white/80';
              span.textContent = shortcut.title.charAt(0).toUpperCase();
              parent.appendChild(span);
            }
          }}
        />
      </div>
      
      <span className="mt-1.5 text-xs text-white/80 truncate max-w-full px-1">
        {shortcut.title}
      </span>
    </a>
  );
});
