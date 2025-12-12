/**
 * 底部 Dock 栏组件 - 显示置顶书签
 * 参考 macOS Dock 和 mtab 底部栏设计
 */

import { useEffect, useState, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTMarksSync } from '../hooks/useTMarksSync';
import type { TMarksBookmark } from '../types';

// 获取 favicon URL
function getFaviconUrl(url: string, favicon?: string): string {
  if (favicon) return favicon;
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return '';
  }
}

// 可排序的书签项
function SortableBookmarkItem({ 
  bookmark, 
  isHovered, 
  onHover,
  wasDragged,
}: {
  bookmark: TMarksBookmark;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  wasDragged: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bookmark.id });

  // 正确组合 transform：拖拽 transform + hover 效果
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : (transition || 'transform 0.2s'),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative cursor-grab active:cursor-grabbing"
    >
      <a
        href={bookmark.url}
        className="relative block w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 overflow-hidden"
        style={{
          transform: isHovered && !isDragging ? 'translateY(-8px) scale(1.15)' : 'translateY(0) scale(1)',
        }}
        onMouseEnter={() => onHover(bookmark.id)}
        onMouseLeave={() => onHover(null)}
        onClick={(e) => {
          // 如果正在拖拽或刚拖拽完，阻止跳转
          if (isDragging || wasDragged) {
            e.preventDefault();
          }
        }}
      >
        {/* 悬浮标题提示 */}
        {isHovered && !isDragging && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-black/90 text-white text-xs whitespace-nowrap z-50 animate-fadeIn pointer-events-none">
            {bookmark.title}
          </div>
        )}
        
        {/* 图标 - 完全填满容器 */}
        <img
          src={getFaviconUrl(bookmark.url, bookmark.favicon)}
          alt={bookmark.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.currentTarget;
            const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=64`;
            if (!target.src.includes('google.com/s2/favicons')) {
              target.src = googleFaviconUrl;
            } else {
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent && !parent.querySelector('.fallback-letter')) {
                const span = document.createElement('span');
                span.className = 'fallback-letter text-lg font-medium text-white/70';
                span.textContent = bookmark.title.charAt(0).toUpperCase();
                parent.appendChild(span);
              }
            }
          }}
        />
      </a>
    </div>
  );
}

export function DockBar() {
  const { syncState, pinnedBookmarks, fetchPinnedBookmarks, reorderPinnedBookmarks } = useTMarksSync();
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [localBookmarks, setLocalBookmarks] = useState<TMarksBookmark[]>([]);
  const [wasDragged, setWasDragged] = useState(false);
  const initialLoadRef = useRef(true);
  const dragTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 同步本地书签列表
  useEffect(() => {
    setLocalBookmarks(pinnedBookmarks);
  }, [pinnedBookmarks]);

  useEffect(() => {
    fetchPinnedBookmarks().finally(() => {
      setHasLoaded(true);
      // 延迟显示，避免初始渲染闪烁
      if (initialLoadRef.current) {
        initialLoadRef.current = false;
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      }
    });
  }, [fetchPinnedBookmarks]);

  // 处理拖拽结束
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    // 标记刚拖拽完成，短时间内阻止点击
    setWasDragged(true);
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    dragTimeoutRef.current = setTimeout(() => {
      setWasDragged(false);
    }, 200);
    
    if (!over || active.id === over.id) return;

    const oldIndex = localBookmarks.findIndex((b) => b.id === active.id);
    const newIndex = localBookmarks.findIndex((b) => b.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      // 立即更新本地顺序
      const newBookmarks = [...localBookmarks];
      const [removed] = newBookmarks.splice(oldIndex, 1);
      newBookmarks.splice(newIndex, 0, removed);
      setLocalBookmarks(newBookmarks);

      // 异步更新到后端
      await reorderPinnedBookmarks(newBookmarks.map(b => b.id));
    }
  };

  // 双击刷新（强制从后端获取）
  const handleDoubleClick = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await fetchPinnedBookmarks(true); // 强制刷新
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // 加载中或无书签时不显示
  if (!hasLoaded || syncState.error || localBookmarks.length === 0) {
    return null;
  }

  return (
    <div 
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localBookmarks.map((b) => b.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div 
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl glass-dark ${isRefreshing ? 'animate-pulse' : ''}`}
            onDoubleClick={handleDoubleClick}
            title="拖拽排序 | 双击同步最新"
          >
            {localBookmarks.map((bookmark) => (
              <SortableBookmarkItem
                key={bookmark.id}
                bookmark={bookmark}
                isHovered={hoveredId === bookmark.id}
                onHover={setHoveredId}
                wasDragged={wasDragged}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
