/**
 * 备忘录组件
 */

import { useState, useEffect, useRef } from 'react';
import { StickyNote, ChevronDown, ChevronUp } from 'lucide-react';

const NOTES_STORAGE_KEY = 'newtab_notes';

export function Notes() {
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
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

  // 自动调整高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [content]);

  return (
    <div className="w-80 glass rounded-xl p-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <StickyNote className="w-4 h-4" />
          <span className="text-sm font-medium">备忘录</span>
        </button>
        {isSaving && (
          <span className="text-xs text-white/40">保存中...</span>
        )}
      </div>

      {isExpanded && (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="记录一些想法..."
          className="w-full min-h-[80px] max-h-[200px] bg-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none border border-white/10 focus:border-white/30 placeholder-white/40 resize-none"
        />
      )}
    </div>
  );
}
