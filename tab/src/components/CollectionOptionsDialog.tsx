import { useState, useEffect } from 'react';
import { Folder, Plus, List } from 'lucide-react';
import type { TMarksTabGroup } from '@/lib/api/tmarks/tab-groups';

export interface CollectionOption {
  mode: 'new' | 'existing' | 'folder';
  targetId?: string;
  title?: string;
}

interface CollectionOptionsDialogProps {
  tabCount: number;
  groups: TMarksTabGroup[];
  onConfirm: (option: CollectionOption) => void;
  onCancel: () => void;
  onCreateFolder?: (title: string) => Promise<TMarksTabGroup>;
}

export function CollectionOptionsDialog({
  tabCount,
  groups,
  onConfirm,
  onCancel,
  onCreateFolder,
}: CollectionOptionsDialogProps) {
  const [mode, setMode] = useState<'new' | 'existing' | 'folder'>('new');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('__new__');
  const [newGroupTitle, setNewGroupTitle] = useState<string>('');
  const [newFolderTitle, setNewFolderTitle] = useState<string>('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // 分离文件夹和普通分组
  const folders = groups.filter(g => g.is_folder === 1);
  const regularGroups = groups.filter(g => g.is_folder === 0);

  // 设置默认选中项
  useEffect(() => {
    if (mode === 'existing' && regularGroups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(regularGroups[0].id);
    }
    if (mode === 'folder') {
      if (folders.length > 0 && !selectedFolderId) {
        setSelectedFolderId(folders[0].id);
      } else if (folders.length === 0) {
        setSelectedFolderId('__new__');
      }
    }
  }, [mode, regularGroups, folders, selectedGroupId, selectedFolderId]);

  const handleConfirm = async () => {
    const option: CollectionOption = { mode };

    if (mode === 'existing') {
      if (!selectedGroupId) {
        alert('请选择一个分组');
        return;
      }
      option.targetId = selectedGroupId;
    } else if (mode === 'folder') {
      // 如果选择了新建文件夹
      if (selectedFolderId === '__new__') {
        const folderTitle = newFolderTitle.trim();
        if (!folderTitle) {
          alert('请输入文件夹名称');
          return;
        }
        
        if (!onCreateFolder) {
          alert('创建文件夹功能不可用');
          return;
        }

        try {
          setIsCreatingFolder(true);
          const newFolder = await onCreateFolder(folderTitle);
          option.mode = 'folder';
          option.targetId = newFolder.id;
          option.title = newGroupTitle.trim() || undefined;
        } catch (error) {
          alert('创建文件夹失败：' + (error instanceof Error ? error.message : '未知错误'));
          return;
        } finally {
          setIsCreatingFolder(false);
        }
      } else {
        if (!selectedFolderId) {
          alert('请选择一个文件夹');
          return;
        }
        option.targetId = selectedFolderId;
        option.title = newGroupTitle.trim() || undefined;
      }
    } else {
      option.title = newGroupTitle.trim() || undefined;
    }

    onConfirm(option);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[680px] max-h-[520px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-base font-bold text-gray-900">收纳标签页</h2>
          <p className="text-xs text-gray-600 mt-0.5">已选择 <span className="font-semibold text-blue-600">{tabCount}</span> 个标签页</p>
        </div>

        {/* Content - 左右布局 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧：图标按钮 */}
          <div className="w-14 border-r border-gray-200 bg-gray-50 py-3 flex flex-col items-center space-y-2 overflow-y-auto">
            {/* Option 1: Create New Group */}
            <button
              onClick={() => setMode('new')}
              title="创建新分组"
              className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
                mode === 'new'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200'
              }`}
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Option 2: Add to Existing Group */}
            <button
              onClick={() => setMode('existing')}
              disabled={regularGroups.length === 0}
              title={regularGroups.length === 0 ? '暂无可用分组' : '添加到现有分组'}
              className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
                mode === 'existing'
                  ? 'bg-blue-600 text-white shadow-md'
                  : regularGroups.length === 0
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200'
              }`}
            >
              <List className="w-5 h-5" />
            </button>

            {/* Option 3: Add to Folder */}
            <button
              onClick={() => setMode('folder')}
              disabled={folders.length === 0}
              title={folders.length === 0 ? '暂无可用文件夹' : '放入文件夹'}
              className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
                mode === 'folder'
                  ? 'bg-blue-600 text-white shadow-md'
                  : folders.length === 0
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200'
              }`}
            >
              <Folder className="w-5 h-5" />
            </button>
          </div>

          {/* 右侧：配置区域 */}
          <div className="flex-1 p-5 overflow-y-auto bg-white">
            {mode === 'new' && (
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1.5">创建新分组</h3>
                  <p className="text-xs text-gray-600 mb-3">将选中的标签页保存为一个新的分组</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    分组名称（可选）
                  </label>
                  <input
                    type="text"
                    placeholder="留空将自动生成时间戳名称"
                    value={newGroupTitle}
                    onChange={(e) => setNewGroupTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {mode === 'existing' && (
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1.5">添加到现有分组</h3>
                  <p className="text-xs text-gray-600 mb-3">将标签页添加到已有的分组中</p>
                </div>
                {regularGroups.length > 0 ? (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      选择目标分组
                    </label>
                    <select
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      {regularGroups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.title} ({group.item_count || 0} 项)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <List className="w-10 h-10 text-gray-300 mb-2" />
                    <p className="text-xs text-gray-500">暂无可用分组</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">请先创建一个分组</p>
                  </div>
                )}
              </div>
            )}

            {mode === 'folder' && (
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1.5">放入文件夹</h3>
                  <p className="text-xs text-gray-600 mb-3">在文件夹下创建新分组</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    选择文件夹
                  </label>
                  <select
                    value={selectedFolderId}
                    onChange={(e) => setSelectedFolderId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="__new__">+ 新建文件夹</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.title}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedFolderId === '__new__' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      文件夹名称
                    </label>
                    <input
                      type="text"
                      placeholder="请输入文件夹名称"
                      value={newFolderTitle}
                      onChange={(e) => setNewFolderTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    新分组名称（可选）
                  </label>
                  <input
                    type="text"
                    placeholder="留空将自动生成时间戳名称"
                    value={newGroupTitle}
                    onChange={(e) => setNewGroupTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-end space-x-2.5">
          <button
            onClick={onCancel}
            disabled={isCreatingFolder}
            className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={isCreatingFolder}
            className="px-4 py-2 text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingFolder ? '创建中...' : '确认收纳'}
          </button>
        </div>
      </div>
    </div>
  );
}
