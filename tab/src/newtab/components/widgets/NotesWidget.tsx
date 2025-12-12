/**
 * 备忘录组件 - 网格版本
 */

import { useState, useEffect, useRef, memo } from 'react';
import { StickyNote, X } from 'lucide-react';
import type { WidgetRendererProps } from './types';

const NOTES_STORAGE_KEY = 'newtab_notes';

export const NotesWidget = memo(function NotesWidget({
  item,
  onRemove,
  isEditing,
}: WidgetRendererProps) {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // 加载笔记
  useEffect(() => {
    chrome.storage.local.get(NOTES_STORAGE_KEY).then((result) => {
      const data = result[NOTES_STORAGE_KEY] as { content: string; updatedAt: number } | undefined;
      if (data?.content) {
        setContent(data.content);
      }
    });
  }, []);

  // 自动保存
  const handleChange = (value: string) => {
    setContent(value);
    setIsSaving(true);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      chrome.storage.local.set({
        [NOTES_STORAGE_KEY]: { content: value, updatedAt: Date.now() },
      });
      setIsSaving(false);
    }, 500);
  };

  return (
    <div className="group relative h-full p-3 rounded-xl glass-card flex flex-col">
      {isEditing && onRemove && (
        <button
          onClick={() => onRemove(item.id)}
          className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 text-white 
                     opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-white/80">
          <StickyNote className="w-4 h-4" />
          <span className="text-sm font-medium">备忘录</span>
        </div>
        {isSaving && (
          <span className="text-xs text-white/40">保存中...</span>
        )}
      </div>

      {/* 文本区域 */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="记录一些想法..."
        className="flex-1 w-full bg-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none 
                   border border-white/10 focus:border-white/30 placeholder-white/40 resize-none"
      />
    </div>
  );
});
