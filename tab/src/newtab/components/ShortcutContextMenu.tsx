/**
 * 快捷方式右键菜单组件
 */

import { createPortal } from 'react-dom';

import { useEffect, useRef } from 'react';

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  divider?: boolean;
  danger?: boolean;
}

interface ShortcutContextMenuProps {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

export function ShortcutContextMenu({ x, y, items, onClose }: ShortcutContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('contextmenu', onClose);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('contextmenu', onClose);
    };
  }, [onClose]);

  // 调整菜单位置，确保不超出屏幕
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const adjustedX = x + rect.width > window.innerWidth ? window.innerWidth - rect.width - 10 : x;
      const adjustedY = y + rect.height > window.innerHeight ? window.innerHeight - rect.height - 10 : y;
      
      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[180px] rounded-lg glass-dark border border-white/10 shadow-xl py-1 animate-fadeIn"
      style={{ left: x, top: y }}
    >
      {items.map((item, index) => (
        <div key={index}>
          <button
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className={`
              w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors
              ${item.danger ? 'text-red-400 hover:bg-red-500/20' : 'text-white/80 hover:bg-white/10'}
            `}
          >
            <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>
            <span>{item.label}</span>
          </button>
          {item.divider && <div className="h-px bg-white/10 my-1" />}
        </div>
      ))}
    </div>,
    document.body
  );
}
