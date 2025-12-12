/**
 * 文件夹弹窗组件 - 液态玻璃效果
 * 支持内部拖拽排序和拖出文件夹
 */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Edit2, Trash2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ShortcutFolder, Shortcut } from '../types';
import { Z_INDEX } from '../constants/z-index';
import { useNewtabStore } from '../hooks/useNewtabStore';

interface FolderModalProps {
  folder: ShortcutFolder;
  shortcuts: Shortcut[];
  onClose: () => void;
  onDeleteFolder: () => void;
}

// 可排序的文件夹内项目
function SortableFolderItem({ 
  shortcut, 
  onRemove,
  onClick,
}: { 
  shortcut: Shortcut; 
  onRemove: (id: string) => void;
  onClick: (shortcut: Shortcut) => void;
}) {
  const iconRef = useRef<HTMLDivElement>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: shortcut.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  // 动态光泽效果
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative flex flex-col items-center gap-1.5 p-2 rounded-xl cursor-pointer transition-colors hover:bg-white/5"
      onClick={() => !isDragging && onClick(shortcut)}
    >
      <div className="relative w-16 h-16">
        <div 
          ref={iconRef}
          className="w-full h-full rounded-xl liquid-glass-icon flex items-center justify-center overflow-hidden"
        >
          <div className="glass-refraction" />
          {shortcut.favicon ? (
            <img
              src={shortcut.favicon}
              alt={shortcut.title}
              className="w-4/5 h-4/5 object-contain rounded-lg relative z-10"
              draggable={false}
            />
          ) : (
            <div className="w-4/5 h-4/5 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg relative z-10">
              <span className="text-xl font-bold text-white">
                {shortcut.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        
        {/* 移出按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(shortcut.id);
          }}
          className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-400 z-20"
          title="移出文件夹"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      
      <span className="text-xs text-white/90 truncate w-full text-center select-none">
        {shortcut.title}
      </span>
    </div>
  );
}

export function FolderModal({
  folder,
  shortcuts,
  onClose,
  onDeleteFolder,
}: FolderModalProps) {
  const { incrementClickCount, updateShortcut, updateFolder } = useNewtabStore();
  const [isVisible, setIsVisible] = useState(false);
  const [localShortcuts, setLocalShortcuts] = useState(shortcuts);
  const [title, setTitle] = useState(folder.name);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // 同步外部 shortcuts
  useEffect(() => {
    setLocalShortcuts(shortcuts);
  }, [shortcuts]);

  // 同步标题
  useEffect(() => {
    setTitle(folder.name);
  }, [folder.name]);

  // 入场动画
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // 编辑标题时自动聚焦
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleShortcutClick = (shortcut: Shortcut) => {
    incrementClickCount(shortcut.id);
    window.location.href = shortcut.url;
  };

  const handleRemoveFromFolder = (shortcutId: string) => {
    updateShortcut(shortcutId, { folderId: undefined });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localShortcuts.findIndex(s => s.id === active.id);
    const newIndex = localShortcuts.findIndex(s => s.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(localShortcuts, oldIndex, newIndex);
      setLocalShortcuts(newOrder);
      // 更新位置
      newOrder.forEach((s, i) => {
        updateShortcut(s.id, { position: i });
      });
    }
  };

  const handleTitleSave = () => {
    setIsEditingTitle(false);
    const trimmedTitle = title.trim();
    if (trimmedTitle && trimmedTitle !== folder.name) {
      updateFolder(folder.id, { name: trimmedTitle });
    } else {
      setTitle(folder.name);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  return createPortal(
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? 'bg-black/70 backdrop-blur-md opacity-100' : 'opacity-0'
      }`}
      style={{ zIndex: Z_INDEX.MODAL_BACKDROP }}
      onClick={handleClose}
    >
      <div
        className={`liquid-glass rounded-3xl w-full max-w-2xl p-6 shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        style={{ zIndex: Z_INDEX.MODAL_CONTENT }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 flex-1">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSave();
                  if (e.key === 'Escape') {
                    setTitle(folder.name);
                    setIsEditingTitle(false);
                  }
                }}
                className="liquid-glass-mini border border-white/30 rounded-lg px-3 py-1.5 text-white text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-white/40 w-full max-w-[300px] transition-all"
              />
            ) : (
              <h2 
                className="text-xl font-semibold text-white cursor-pointer hover:text-blue-400 flex items-center gap-2 transition-colors"
                onClick={() => setIsEditingTitle(true)}
                title="点击编辑标题"
              >
                {title}
                <Edit2 className="w-4 h-4 opacity-50" />
              </h2>
            )}
          </div>
          <button
            onClick={onDeleteFolder}
            className="p-2 rounded-full liquid-glass-mini hover:border-red-400/50 text-red-400 hover:text-red-300 transition-all hover:scale-110"
            title="删除文件夹"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* 快捷方式网格 */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localShortcuts.map(s => s.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 min-h-[120px]">
              {localShortcuts.length === 0 ? (
                <div className="col-span-full text-center py-12 text-white/50 text-sm">
                  文件夹为空
                </div>
              ) : (
                localShortcuts.map((shortcut) => (
                  <SortableFolderItem
                    key={shortcut.id}
                    shortcut={shortcut}
                    onRemove={handleRemoveFromFolder}
                    onClick={handleShortcutClick}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>,
    document.body
  );
}
