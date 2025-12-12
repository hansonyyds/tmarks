/**
 * 拖拽覆盖层项目组件 - 显示拖拽时的预览
 */

import { Folder } from 'lucide-react';
import { getFaviconUrl } from '../utils/favicon';
import type { Shortcut, ShortcutFolder } from '../types';

interface DragOverlayItemProps {
  item: (Shortcut | ShortcutFolder) & { itemType: 'shortcut' | 'folder' };
  shortcuts?: Shortcut[];
}

export function DragOverlayItem({ item, shortcuts = [] }: DragOverlayItemProps) {
  if (item.itemType === 'folder') {
    const folder = item as ShortcutFolder;
    const previewShortcuts = shortcuts.slice(0, 9);
    const iconSize = 56;
    const padding = iconSize * 0.12;

    return (
      <div className="flex flex-col items-center gap-2 w-16 opacity-90 cursor-grabbing">
        <div
          className="relative liquid-glass-folder rounded-[18px] overflow-hidden shadow-2xl scale-110"
          style={{
            width: `${iconSize}px`,
            height: `${iconSize}px`,
            padding: `${padding}px`,
          }}
        >
          <div className="glass-refraction" />
          {previewShortcuts.length > 0 ? (
            <div className="w-full h-full grid grid-cols-3 gap-0.5 content-start relative z-10">
              {previewShortcuts.map((shortcut) => {
                const faviconUrl = getFaviconUrl(shortcut);
                return (
                  <div
                    key={shortcut.id}
                    className="aspect-square rounded-md overflow-hidden liquid-glass-mini flex items-center justify-center"
                  >
                    {faviconUrl ? (
                      <img
                        src={faviconUrl}
                        alt=""
                        className="w-full h-full object-cover rounded-md"
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
              })}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center relative z-10">
              <Folder className="w-6 h-6 text-white/60" />
            </div>
          )}
        </div>
        <span className="text-sm font-medium text-white/90 drop-shadow-md truncate text-center w-full">
          {folder.name}
        </span>
      </div>
    );
  }

  // 快捷方式
  const shortcut = item as Shortcut;
  const faviconUrl = getFaviconUrl(shortcut);

  return (
    <div className="flex flex-col items-center gap-2 w-16 opacity-90 cursor-grabbing">
      <div className="relative w-14 h-14 rounded-[18px] liquid-glass-icon flex items-center justify-center overflow-hidden shadow-2xl scale-110">
        <div className="glass-refraction" />
        {faviconUrl ? (
          <img
            src={faviconUrl}
            alt={shortcut.title}
            className="w-[85%] h-[85%] object-contain rounded-xl relative z-10"
            draggable={false}
          />
        ) : (
          <div className="w-[80%] h-[80%] flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl relative z-10">
            <span className="text-2xl font-bold text-white">
              {shortcut.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <span className="text-sm font-medium text-white/90 drop-shadow-md truncate text-center w-full">
        {shortcut.title}
      </span>
    </div>
  );
}
