/**
 * 批量编辑快捷方式弹窗
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, FolderInput } from 'lucide-react';
import { useNewtabStore } from '../hooks/useNewtabStore';
import { Z_INDEX } from '../constants/z-index';

interface BatchEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BatchEditModal({ isOpen, onClose }: BatchEditModalProps) {
  const { shortcutGroups, removeShortcut, updateShortcut, getFilteredShortcuts } = useNewtabStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetGroupId, setTargetGroupId] = useState<string>('');

  const filteredShortcuts = getFilteredShortcuts();

  useEffect(() => {
    if (!isOpen) {
      setSelectedIds(new Set());
      setTargetGroupId('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredShortcuts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredShortcuts.map(s => s.id)));
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedIds.size} 个快捷方式吗？`)) return;
    
    selectedIds.forEach(id => removeShortcut(id));
    setSelectedIds(new Set());
  };

  const handleBatchMove = () => {
    if (selectedIds.size === 0 || !targetGroupId) return;
    
    selectedIds.forEach(id => {
      updateShortcut(id, { groupId: targetGroupId });
    });
    setSelectedIds(new Set());
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 animate-fadeIn"
      style={{ zIndex: Z_INDEX.MODAL_BACKDROP }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[80vh] rounded-2xl glass-modal-dark flex flex-col overflow-hidden"
        style={{ zIndex: Z_INDEX.MODAL_CONTENT }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-medium text-white">批量编辑快捷方式</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* 操作栏 */}
        <div className="flex items-center gap-4 px-6 py-3 border-b border-white/10 bg-white/5">
          <button
            onClick={handleSelectAll}
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            {selectedIds.size === filteredShortcuts.length ? '取消全选' : '全选'}
          </button>
          <span className="text-sm text-white/50">
            已选择 {selectedIds.size} 项
          </span>
          <div className="flex-1" />
          <button
            onClick={handleBatchDelete}
            disabled={selectedIds.size === 0}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            删除选中
          </button>
        </div>

        {/* 快捷方式列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-4 gap-4">
            {filteredShortcuts.map((shortcut) => (
              <div
                key={shortcut.id}
                onClick={() => handleToggleSelect(shortcut.id)}
                className={`
                  relative flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer transition-all
                  ${selectedIds.has(shortcut.id) 
                    ? 'bg-blue-500/20 border-2 border-blue-500' 
                    : 'glass hover:bg-white/10 border-2 border-transparent'
                  }
                `}
              >
                {/* 选中标记 */}
                {selectedIds.has(shortcut.id) && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                {/* 图标 */}
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                  <img
                    src={shortcut.favicon}
                    alt={shortcut.title}
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.fallback-letter')) {
                        const span = document.createElement('span');
                        span.className = 'fallback-letter text-lg font-medium text-white/70';
                        span.textContent = shortcut.title.charAt(0).toUpperCase();
                        parent.appendChild(span);
                      }
                    }}
                  />
                </div>

                {/* 标题 */}
                <span className="text-xs text-white/80 truncate max-w-full text-center">
                  {shortcut.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 底部操作栏 */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-4 px-6 py-4 border-t border-white/10 bg-white/5">
            <FolderInput className="w-5 h-5 text-white/70" />
            <span className="text-sm text-white/70">移动到：</span>
            <select
              value={targetGroupId}
              onChange={(e) => setTargetGroupId(e.target.value)}
              className="flex-1 bg-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none border border-white/10"
            >
              <option value="">选择分组</option>
              {shortcutGroups.map((group) => (
                <option key={group.id} value={group.id} className="bg-gray-800">
                  {group.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleBatchMove}
              disabled={!targetGroupId}
              className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              移动
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
